
import { CommonLog } from "../common/log"
import { OnDecodeError, OnFrame } from "./type"

const log = new CommonLog('WebVideoDecoder')
export class WebVideoDecoder {
	#decoder: VideoDecoder | null = null
	#decoding: boolean = false

	get decodeQueueSize() {
		return this.#decoder?.decodeQueueSize ?? 0
	}

	static async isSupport(config: VideoDecoderConfig) {
		return self.VideoDecoder && (await VideoDecoder.isConfigSupported(config)).supported
	}

	constructor(private decoderConf: VideoDecoderConfig, private onFrame: OnFrame, private onDecodeError: OnDecodeError) {
		if (!VideoDecoder.isConfigSupported(decoderConf)) {
			const errMsg = `VideoDecoder is not support config, ${JSON.stringify(decoderConf)}`
			log.error(errMsg)
			onDecodeError(new Error(errMsg))
			return
		}

		this.#decoder = new VideoDecoder({
			output: this.onFrame,
			error: this.onDecodeError
		})

		this.#decoder.configure(this.decoderConf)
	}

	public decode(chunks: EncodedVideoChunk[]) {
		if (this.#decoder == null || this.#decoder.state !== 'configured') {
			throw new Error('Decoder is not prepared')
		}

		if (this.#decoding) return

		this.#decoding = true
		for (let i = 0; i < chunks.length; i++)
			this.#decoder.decode(chunks[i])

		// this.#decoder.flush().catch(err => {
		// 	if (!(err instanceof Error)) throw err;
		// 	if (
		// 		err.message.includes('Decoding error') &&
		// 			this.onDecodeError != null
		// 	) {
		// 		this.onDecodeError(err);
		// 		return;
		// 	}

		// 	// reset 中断解码器，预期会抛出 AbortedError
		// 	if (!err.message.includes('Aborted due to close')) {
		// 		throw err;
		// 	}
		// })

		this.#decoding = false
	}

	public reset() {

	}
}