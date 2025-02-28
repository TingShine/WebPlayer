import type { IPlayerManagerOptions } from "../manager/type";

export interface IPlayerOptions extends IPlayerManagerOptions {
	// TODO: Worker解码
	useWorker?: boolean
	// TODO: 自动播放
	autoplay?: boolean
	// TODO: 静音
	muted?: boolean
	// TODO: 海报url
	poster?: string
}
