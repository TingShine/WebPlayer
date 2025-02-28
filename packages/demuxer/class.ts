import type { ExtMP4Sample } from './type'
import type { WebFetcher } from '../fetcher'
import { mp4FileToSamples } from './utils'
import type { MP4DecodeConf } from '../decoder/type'
import type { VideoTrackOpts } from 'mp4box'

export class WebDemuxer {
		public videoSamples: ExtMP4Sample[] = []
		public decodeConf: MP4DecodeConf | null = null
		public videoTrack: VideoTrackOpts | null = null

		public demuxed = false

		public async demux(fetcher: WebFetcher) {
			const { decoderConfig, videoSamples, videoTrack } = await mp4FileToSamples(fetcher)
			this.videoSamples = videoSamples
			this.decodeConf = decoderConfig
			this.videoTrack = videoTrack
			this.demuxed = true
		}

		public destroy() {
			this.videoSamples = []
			this.decodeConf = null
			this.videoTrack = null
			this.demuxed = false
		}
}
