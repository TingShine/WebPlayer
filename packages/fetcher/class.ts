import type { IFetcherInput } from "./type";
import { isFile, isURL } from "./utils";
import { write, file } from 'opfs-tools'

const getID = () => +new Date()

export class WebFetcher {
	#localFile = `codecs-temp-dir/file_${getID()}`
	public loaded = false

	public async load (input: IFetcherInput): Promise<string> {
		if (this.loaded) throw new Error('WebFetcher can only load once, please invoke `destroy` method if reuse the instance')
		
		if (isURL(input)) {
			await write(this.#localFile, await this.fetchRemoteURL(input))
		} else if (isFile(input)) {
			await write(this.#localFile, this.getLocalFileStream(input))
		} else if (input instanceof ReadableStream) {
			await write(this.#localFile, input)
		} else {
			throw new Error('Invalid input format, only receive url, file or readablestream')
		}

		this.loaded = true
		return this.#localFile
	}

	public async getReader () {
		if (!this.loaded) throw new Error('The instance has not loaded file')

		return await file(this.#localFile).createReader()
	}

	public async destroy() {
		if (this.loaded) await file(this.#localFile).remove()
		this.loaded = false
		this.#localFile = `codecs-temp-dir/file_${getID()}`
	}

	private fetchRemoteURL (url: string) {
		return fetch(url).then(response => response.body!)
	}

	private getLocalFileStream (file: File) {
		return file.stream()
	}
}