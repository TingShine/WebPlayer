import { VideoRender } from "../render";
import { IPlayerManagerOptions } from "./type";
import { WebFetcher } from '../fetcher'
import { WebDemuxer } from '../demuxer'
import { WebVideoDecoder } from '../decoder'
import { videoSamples2Chunks } from "./utils";
import { Queue } from '../common/queue'


export class PlayerManager {
	videoRenderControl: VideoRender
	fetcher: WebFetcher = new WebFetcher()
	demuxer: WebDemuxer = new WebDemuxer()
	decoder: WebVideoDecoder | null = null

	frames: Queue<VideoFrame> = new Queue({ maxSize: 100 })
	cursorIndex = 0

	constructor(private options: IPlayerManagerOptions) {
		this.videoRenderControl = new VideoRender(options)
		this.fetcher.load(options.url).then(() => {
			this.demuxer.demux(this.fetcher).then(() => {
				this.initDecoder()
			})
		})
	}

	private async initDecoder() {
		const vt = this.demuxer.videoTrack
		if (vt) {
			const { width, height, } = vt
			this.videoRenderControl.setMetaData({ width, height })

			const decodeConf = this.demuxer.decodeConf
			if (decodeConf?.video && (await WebVideoDecoder.isSupport(decodeConf.video))) {
				this.decoder = new WebVideoDecoder(decodeConf.video, this.onFrames.bind(this), (err) => {
					console.error(err)
				})

				this.cursorIndex = 0
				this.render()
				this.startDecode()
			}
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
		requestAnimationFrame(() => {
			const vf = this.frames.shift()
			if (vf) {
				this.videoRenderControl.draw(vf)
			}

			if (this.frames.canAddSize >= 60) {
				this.startDecode()
			}

			this.render()
		})
	}
}