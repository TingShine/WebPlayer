import type { IPlayerManagerOptions } from "./type";
import { WebFetcher } from '../fetcher'
import { WebDemuxer } from '../demuxer'
import { WebVideoDecoder } from '../decoder'
import { checkOptions, findSampleByTimestamp, videoSamples2Chunks } from "./utils";
import { Queue } from '../common/queue'
import { BUFFER_DECODE_FRAMES, BUFFER_FRAMES, BUFFER_MAX_FRAMES, BUFFER_NEED_DECODE_FRAMES } from "./constants";
import type { SyncManger } from "../sync";

/** 管理视频获取，解封装和解码
 * 
 * TODO: 迁移到worker
 */
export class PlayerManager {
	private fetcher: WebFetcher = new WebFetcher()
	private demuxer: WebDemuxer = new WebDemuxer()
	private decoder: WebVideoDecoder | null = null

	private frames: Queue<VideoFrame> = new Queue({ maxSize: BUFFER_FRAMES })
	private cursorIndex = 0

	private hasError = false

	private firstRendered = true
	private duration = 0
	private preRenderState = {
		time: 0,
		duration: 0,
		timer: 0
	}
	private syncManger: SyncManger | null = null

	private state = {
		seeking: false,
		seekTimestamp: 0
	}

	public get isPlayEnd () {
		return this.cursorIndex >= this.demuxer.videoSamples.length && this.decoder.decodeQueueSize === 0
	}

	constructor(private options: IPlayerManagerOptions) {
		checkOptions(options)
		this.fetchAndDemux()
		this.bindEvent()
	}

	public play() {
		this.render()
	}

	public pause() {
		if (this.preRenderState.timer) {
			clearTimeout(this.preRenderState.timer)
			this.preRenderState.timer = 0
		}
		this.preRenderState.time = 0
		this.preRenderState.duration = 0
	}

	public async seek(timestamp: number) {
		this.pause()
		
		if (this.frames.length) {
			const firstFrame = this.frames.at(0)
			const lastFrame = this.frames.at(-1)

			// 在缓冲区间seek，抛弃部分帧
			if (firstFrame && lastFrame && timestamp >= firstFrame.timestamp / 1e3 && timestamp <= lastFrame.timestamp / 1e3) {
				while (this.frames.length) {
					const frame = this.frames.shift()
					if (timestamp > frame.timestamp / 1e3) {
						frame.close()
					} else {
						this.syncManger.emit("seeked", frame)
						this.startDecode()
						return
					}
				}
			}
		}

		// 范畴之外，找到最近的IDR帧开始解码
		await this.decoder.flush()
		while (this.frames.length) {
			const vf = this.frames.pop()
			vf.close()
		}
		this.state.seeking = true
		this.state.seekTimestamp = timestamp * 1e3
		const { idrIndex, index } = findSampleByTimestamp(this.demuxer.videoSamples, timestamp * 1e3)
		this.cursorIndex = index + BUFFER_NEED_DECODE_FRAMES
		const chunks = await videoSamples2Chunks(this.demuxer.videoSamples.slice(idrIndex, this.cursorIndex), await this.fetcher.getReader())
		this.decoder.decode(chunks)
	}

	public destroy() {
		this.demuxer.destroy()
		this.fetcher.destroy()
		this.decoder?.destroy()
	}

	public register(syncManger: SyncManger) {
		this.syncManger = syncManger
	}

	public reset() {
		if (this.preRenderState.timer) clearTimeout(this.preRenderState.timer)
		
		this.preRenderState = { time: 0, duration: 0, timer: 0 }
		this.cursorIndex = 0
		while (this.frames.length) {
			const vf = this.frames.pop()
			vf.close()
		}
		this.startDecode()
	}

	private async fetchAndDemux() {
		try {
			await this.fetcher.load(this.options.input)
			await this.demuxer.demux(this.fetcher)

			const vt = this.demuxer.videoTrack
			if (!vt) {
				this.hasError = true
				return
			}

			const { width, height, duration } = vt
			const meta = ({ width, height, duration: duration / 1e3 })
			this.syncManger.emit('metadata', meta)
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
			this.startDecode()
		} else {
			this.hasError = true
		}
	}

	private async startDecode() {
		if (!this.decoder || this.cursorIndex >= this.demuxer.videoSamples.length || this.frames.length >= BUFFER_MAX_FRAMES || this.decoder.decodeQueueSize >= BUFFER_MAX_FRAMES) return
		console.log('start decode', this.cursorIndex);
		
		const index = this.cursorIndex
		this.cursorIndex += BUFFER_DECODE_FRAMES
		const chunks = await videoSamples2Chunks(this.demuxer.videoSamples.slice(index, index + BUFFER_DECODE_FRAMES), await this.fetcher.getReader())
		this.decoder.decode(chunks)
	}

	private onFrames(vf: VideoFrame) {
		this.frames.push(vf)
	}

	private render() {
		if (this.preRenderState.timer) clearTimeout(this.preRenderState.timer)

		const vf = this.frames.shift()
		if (vf) {
			const duration = vf.duration / 1e3

			// 初始化展示
			if (!this.preRenderState.time) {
				this.drawFrame(vf, duration)
				return
			}

			const now = performance.now()
			let costTime = now - this.preRenderState.time
			
			// 超出时间
			if (costTime > this.preRenderState.duration) {
				costTime -= this.preRenderState.duration
				// 仍为下一帧，缩减时间
				if (costTime < duration) {
					this.drawFrame(vf, duration - costTime)
					return
				}

				// 跳帧
				console.log('deprecate frame');
				vf.close()
				costTime -= duration
				while (this.frames.length) {
					const nextVf = this.frames.shift()
					if (costTime < nextVf.duration / 1e3) {
						this.drawFrame(nextVf, nextVf.duration / 1e3 - costTime)
						return
					}
					costTime -= nextVf.duration / 1e3
					nextVf.close()
					console.log('deprecate frame');
				}

				// 没有符合需求的帧
				console.log('Wait for next frame');
				this.preRenderState.time = now
				this.preRenderState.duration = costTime
				this.preRenderState.timer = setTimeout(() => this.render(), 50)
				return
			}

			this.drawFrame(vf, this.preRenderState.duration - costTime + duration)
		} else {
			// 没有帧
			if (!this.isPlayEnd) {
				this.startDecode()
				this.preRenderState.timer = setTimeout(() => this.render(), 50)
			} else {
				this.syncManger.emit('ended')
				console.log('play ended');
				this.pause()
			}
		}
	}

	private drawFrame(frame: VideoFrame, delay: number) {
		this.preRenderState.time = performance.now()
		this.preRenderState.duration = frame.duration / 1e3
		this.syncManger?.draw(frame)
		this.preRenderState.timer = setTimeout(() => this.render(), delay)

		const timestamp = frame.timestamp / 1e3
		this.syncManger.setProgress((timestamp + frame.duration / 1e3) / (this.duration ?? 1) * 100)
		frame.close()

		if (this.frames.length <= BUFFER_NEED_DECODE_FRAMES) {
			this.startDecode()
		}
	}

	private bindEvent() {
		this.frames.setSizeChangeCallback(() => {
			if (this.firstRendered && (this.frames.length >= 20 || (this.frames.length >= 10 && this.decoder.decodeQueueSize >= 10))) {
				this.firstRendered = false
				this.syncManger?.emit('canplay', this.frames.at(0).clone())
			}

			if (this.state.seeking && this.frames.length) {
				const frame = this.frames.at(0)
				if (frame.timestamp < this.state.seekTimestamp) {
					const vf = this.frames.shift()
					vf.close()
					return
				}

				this.state.seeking = false
				this.state.seekTimestamp = 0
				this.syncManger?.emit('seeked', this.frames.at(0).clone())
			}

			const lastFrame = this.frames.at(0)
			const firstFrame = this.frames.at(-1)
			if (firstFrame && lastFrame) {
				this.syncManger.setBufferProgress((firstFrame.timestamp - lastFrame.timestamp + firstFrame.duration) / 1e3 / this.duration * 100)
			} else {
				this.syncManger.setBufferProgress(0)
			}
		})

		
	}
}