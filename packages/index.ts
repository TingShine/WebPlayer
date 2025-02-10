import { WebDemuxer } from "./demuxer/class";
import { WebFetcher } from "./fetcher";
import { IFetcherInput } from "./fetcher/type";
import { VideoFrameFinder } from "./finder";

export class VideoExtractFrameModule {
	public state = {
		fetched: false,
		demuxed: false,
		initd: false
	}

	#fetcher: WebFetcher = new WebFetcher()
	#demuxer: WebDemuxer = new WebDemuxer()
	#frameFinder: VideoFrameFinder | null = null

	public async load(input: IFetcherInput) {
		await this.#fetcher.load(input)
		this.state.fetched = true

		await this.#demuxer.demux(this.#fetcher)
		this.state.demuxed = true

		this.#frameFinder = new VideoFrameFinder(await this.#fetcher.getReader(), this.#demuxer.videoSamples, this.#demuxer.decodeConf!.video!)
		this.state.initd = true

		return this.#demuxer!.videoTrack!
}

	public async find(time: number) {
		if (!this.state.initd) throw new Error("Should load first")
		
		const vf = await this.#frameFinder?.find(time)
		return vf
	}

	public async thumbnails (params: { start: number, end: number, step: number }) {
		if (!this.state.demuxed)  throw new Error("Should load first")

		const frameFinder = new VideoFrameFinder(await this.#fetcher.getReader(), this.#demuxer.videoSamples, this.#demuxer.decodeConf!.video!)
		const { start, end, step } = params

		const frames = []
		let cur = start
		while (cur <= end) {
			const vf = await frameFinder.find(cur)
			if (vf) frames.push(vf)
			cur += step
		}

		frameFinder.destroy()
		return frames
	}

	public destroy() {
		this.#frameFinder?.destroy()
		this.#demuxer.destroy()
		this.#fetcher.destroy()
	}
}