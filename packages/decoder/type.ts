
export type OnFrame = (videoFrame: VideoFrame) => void

export type OnDecodeError = (err: Error) => void

export interface MP4DecodeConf {
	video: VideoDecoderConfig | null
	audio: AudioDecoderConfig | null
}