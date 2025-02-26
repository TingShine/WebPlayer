import { WebDemuxer } from "@demuxer";
import { WebFetcher } from "@fetcher";
import type { IFetcherInput } from "@fetcher";
import { VideoFrameFinder } from "./core";
import type { VideoTrackOpts } from 'mp4box'
import type { IThumbnailsParams } from "./types";

export class CodecsExtractFrameModule {
	public state = {
		fetched: false,
		demuxed: false,
		initd: false
	}

	#fetcher: WebFetcher = new WebFetcher()
	#demuxer: WebDemuxer = new WebDemuxer()
	#frameFinder: VideoFrameFinder | null = null

	static isSupport() {
		return window?.VideoDecoder && window?.isSecureContext
	}

	public async load(input: IFetcherInput): Promise<VideoTrackOpts> {
		await this.#fetcher.load(input)
		this.state.fetched = true

		await this.#demuxer.demux(this.#fetcher)
		this.state.demuxed = true

		this.#frameFinder = new VideoFrameFinder(await this.#fetcher.getReader(), this.#demuxer.videoSamples, this.#demuxer.decodeConf.video)
		this.state.initd = true

		return this.#demuxer.videoTrack
}

	public async find(time: number) {
		if (!this.state.initd) throw new Error("Should load first")
		
		const vf = await this.#frameFinder?.find(time)
		return vf
	}

	public async thumbnails (params: IThumbnailsParams) {
		if (!this.state.demuxed)  throw new Error("Should load first")

		const frameFinder = new VideoFrameFinder(await this.#fetcher.getReader(), this.#demuxer.videoSamples, this.#demuxer.decodeConf.video)
		const { start, end, step } = params

		const frames: VideoFrame[] = []
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
