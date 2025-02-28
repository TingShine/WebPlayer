import type { IFetcherInput } from "../fetcher";
import type { IVideoRenderOptions } from "../render/type";

export interface IPlayerManagerOptions extends IVideoRenderOptions {
	input: IFetcherInput
}