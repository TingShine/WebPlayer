import { createFile } from 'mp4box'
import { ExtMP4Sample } from './type'

export class WebDemuxer {
		#videoSamples: ExtMP4Sample[] = []

		load (stream: ReadableStream<Uint8Array<ArrayBufferLike>>) {
			
		}
}