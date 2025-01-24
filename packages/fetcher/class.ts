import { IFetcherInput } from "./type";
import { isFile, isURL } from "./utils";

export class WebFetcher {
	constructor() {}
	#readstream: ReadableStream<Uint8Array<ArrayBufferLike>>

	async load (input: IFetcherInput): Promise<ReadableStream<Uint8Array<ArrayBufferLike>>> {
		if (isURL(input)) {
			this.#readstream = await this.fetchRemoteURL(input)
		} else if (isFile(input)) {
			this.#readstream = this.getLocalFileStream(input)
		} else {
			this.#readstream = input
		}

		return this.#readstream
	}

	private fetchRemoteURL (url: string) {
		return fetch(url).then(response => response.body!)
	}

	private getLocalFileStream (file: File) {
		return file.stream()
	}
}