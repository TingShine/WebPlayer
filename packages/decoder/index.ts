
import { CommonLog } from "../common/log"
import type { OnDecodeError, OnFrame } from "./type"

const log = new CommonLog('WebVideoDecoder')
export class WebVideoDecoder {
	private decoder: VideoDecoder | null = null
	private decoding = false

	get decodeQueueSize() {
		return this.decoder?.decodeQueueSize ?? 0
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

		this.decoder = new VideoDecoder({
			output: this.onFrame,
			error: this.onDecodeError
		})

		this.decoder.configure(this.decoderConf)
	}

	public decode(chunks: EncodedVideoChunk[]) {
		if (this.decoder == null || this.decoder.state !== 'configured') {
			throw new Error('Decoder is not prepared')
		}

		if (this.decoding) return

		this.decoding = true
		for (let i = 0; i < chunks.length; i++)
			this.decoder.decode(chunks[i])

		this.decoding = false
	}

	public flush() {
		return this.decoder.flush()
	}

	public destroy() {
		if (this.decoder) {
			this.decoder.close()
			this.decoder = null
		}
		this.decoding = false
	}

	public reset() {

	}
}