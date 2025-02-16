import { VideoRender } from "../render";
import { IPlayerManagerOptions } from "./type";
import { WebFetcher } from '../fetcher'
import { WebDemuxer } from '../demuxer'
import { WebVideoDecoder } from '../decoder'
import { checkOptions, videoSamples2Chunks } from "./utils";
import { Queue } from '../common/queue'

export class PlayerManager {
	private videoRenderControl: VideoRender
	private fetcher: WebFetcher = new WebFetcher()
	private demuxer: WebDemuxer = new WebDemuxer()
	private decoder: WebVideoDecoder | null = null

	private frames: Queue<VideoFrame> = new Queue({ maxSize: 100 })
	private cursorIndex = 0

	private hasError: boolean = false

	private duration: number = 0
	private lastRenderTime: number = 0
	private timer: number = 0

	constructor(private options: IPlayerManagerOptions) {
		checkOptions(options)

		this.initUI()
		this.fetchAndDemux()
	}

	public destroy() {
		this.videoRenderControl.destroy()
		this.demuxer.destroy()
		this.fetcher.destroy()
	}

	private initUI() {
		this.videoRenderControl = new VideoRender(this.options)
	}

	private async fetchAndDemux() {
		try {
			await this.fetcher.load(this.options.url)
			await this.demuxer.demux(this.fetcher)

			const vt = this.demuxer.videoTrack
			if (!vt) {
				this.hasError = true
				return
			}

			const { width, height, duration } = vt
			this.videoRenderControl.setMetaData({ width, height })
			this.duration = duration / 1e3

			this.initDecoder()
		} catch (err) {
			this.hasError = true
		}
	}

	private async initDecoder() {
		if (this.hasError) return


		const decodeConf = this.demuxer.decodeConf
		if (decodeConf?.video && (await WebVideoDecoder.isSupport(decodeConf.video))) {
			this.decoder = new WebVideoDecoder(decodeConf.video, this.onFrames.bind(this), (err) => {
				console.error(err)
			})

			this.cursorIndex = 0
			this.render()
			this.startDecode()
		} else {
			this.hasError = true
		}
	}

	private async startDecode() {
		if (!this.decoder || this.cursorIndex >= this.demuxer.videoSamples.length || this.frames.length >= 60 || this.decoder.decodeQueueSize >= 60) return
		console.log('start decode', this.cursorIndex);
		
		const index = this.cursorIndex
		this.cursorIndex += 200
		const chunks = await videoSamples2Chunks(this.demuxer.videoSamples.slice(index, index + 200), await this.fetcher.getReader())
		this.decoder.decode(chunks)
	}

	private onFrames(vf: VideoFrame) {
		this.frames.push(vf)
	}

	private render() {
		if (this.timer) clearTimeout(this.timer)
		

		const vf = this.frames.shift()
		console.log('run', vf);

		if (vf) {
			const duration = vf.duration / 1e3
			const now = performance.now()
			let costTime = now - this.lastRenderTime

			if (costTime > duration) {
				
				// 仍为下一帧，缩减时间
				if (costTime < 2 * duration) {
					this.drawFrame(vf)
					this.timer = setTimeout(() => this.render(), costTime - duration)
					return
				}

				// 跳帧
				costTime -= duration
				while (this.frames.length) {
					let vf = this.frames.shift()
					costTime -= vf.duration / 1e3
					if (costTime < duration) {
						this.drawFrame(vf)
						this.timer = setTimeout(() => this.render(), duration - costTime)
						return
					}
					vf.close()
				}

				return
			}

			this.drawFrame(vf)

			this.timer = setTimeout(() => this.render(), duration - costTime)
		} else {
			// 没有帧
			if (!this.isPlayEnd) {
				
				this.startDecode()
				this.timer = setTimeout(() => this.render(), 50)
			} else {
				console.log('play ended');
			}
		}
	}

	private drawFrame(frame: VideoFrame) {
		this.lastRenderTime = performance.now()
		this.videoRenderControl.draw(frame)
		const timestamp = frame.timestamp / 1e3
		const lastFrame = this.frames.at(0)
		const firstFrame = this.frames.at(-1)
		this.videoRenderControl.setProgress(timestamp / (this.duration ?? 1) * 100, lastFrame && firstFrame ? ((firstFrame.timestamp - lastFrame.timestamp) / 1e3 / this.duration * 100) : 0)
		frame.close()
	}

	private get isPlayEnd () {
		return this.cursorIndex >= this.demuxer.videoSamples.length && this.decoder.decodeQueueSize === 0
	}
}