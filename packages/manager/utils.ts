import { ExtMP4Sample } from "../demuxer/dist/types/demuxer/src"
import { IFileReader } from "../fetcher/dist/types/src"


export const videoSamples2Chunks = async (samples: ExtMP4Sample[], reader: IFileReader) => {
	const first = samples[0]
	const last = samples.at(-1)
	if (last == null) return []

	const rangeSize = last.offset + last.size - first.offset

		// 单次读取数据小于30MB时，一次性读取降低频次，但需要加载到内存中
	if (rangeSize < 30e6) {
		const data = new Uint8Array(
			await reader.read(rangeSize, { at: first.offset })
		)

		return samples.map((s) => {
			const offset = s.offset - first.offset
			return new EncodedVideoChunk({
				type: s.is_idr ? 'key' : 'delta',
				timestamp: s.cts,
				duration: s.duration,
				data: data.subarray(offset, offset + s.size)
			})
		})
	}

	// 大于30MB，分次读取
	return await Promise.all(
		samples.map(async (s) => {
			return new EncodedVideoChunk({
				type: s.is_idr ? 'key': 'delta',
				timestamp: s.cts,
				duration: s.duration,
				data: await reader.read(s.size, {
					at: s.offset
				})
			})
		})
	)
}