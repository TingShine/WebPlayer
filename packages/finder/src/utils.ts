import type { ExtMP4Sample } from "@demuxer"
import type { IFileReader } from "@fetcher"

export const sleep = async (time: number) => new Promise((resolve) => setTimeout(resolve, time))

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

export const decodeChunks = (decoder: VideoDecoder, chunks: EncodedVideoChunk[], opts: { onDecodingError?: (err: Error) => void }) => {
	if (decoder.state !== 'configured') return

	for (let i = 0; i < chunks.length; i++)
		decoder.decode(chunks[i])

	 // windows 某些设备 flush 可能不会被 resolved，所以不能 await flush
	 decoder.flush().catch((err) => {
    if (!(err instanceof Error)) throw err;
    if (
      err.message.includes('Decoding error') &&
      opts.onDecodingError != null
    ) {
      opts.onDecodingError(err);
      return;
    }
    // reset 中断解码器，预期会抛出 AbortedError
    if (!err.message.includes('Aborted due to close')) {
      throw err;
    }
  });
}
