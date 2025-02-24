import type { VideoTrackOpts } from "mp4box"
import type { IFetcherInput } from "@fetcher"
import { WorkerEventEnum } from "./constants"
import type { IThumbnailsParams, WorkerResponse } from "./types"
import { CustomError, ErrorTypeEnum } from '../../common/error'
import WorkerModule from 'web-worker:./worker.ts'

const getMessageID = (() => {
	let messageID = 0
	return () => messageID++
})()

interface Callbacks {
  [id: number | string]: (data: any) => void;
}

export class CodecsExtractFrameWorkerModule {
	#loaded = false
	#worker: Worker
	#resolves: Callbacks = {}
	#rejects: Callbacks = {}
	
	public get loaded() {
		return this.#loaded
	}

	static isSupport() {
		return window?.VideoDecoder && window?.isSecureContext
	}

	constructor() {
		if (!CodecsExtractFrameWorkerModule.isSupport()) {
			throw new Error('')
		}

		this.#worker = new WorkerModule()
		this.initEvent()
	}
	
	public load(input: IFetcherInput) {
		let data: IFetcherInput = input

		if (input instanceof File) {
			data = input.stream()
		}
 
		return this.#send<VideoTrackOpts>({ type: WorkerEventEnum.INIT, data }, typeof input === 'string' ? [] : [data as ReadableStream<Uint8Array>])
	}

	public find(time: number) {
		if (!this.loaded) throw new CustomError(ErrorTypeEnum.UN_LOADED)

		return this.#send<VideoFrame | null>({ type: WorkerEventEnum.FIND, data: time })
	}

	public thumbnails(params: IThumbnailsParams) {
		if (!this.loaded) throw new CustomError(ErrorTypeEnum.UN_LOADED)

		return this.#send<Array<VideoFrame | null>>({ type: WorkerEventEnum.THUMBNAILS, data: params })
	}

	public destroy() {
		this.#send({ type: WorkerEventEnum.CLOSE })
		this.#worker.terminate()
		const ids = Object.keys(this.#rejects)
		for (const id of ids) {
			this.#rejects[id](new CustomError(ErrorTypeEnum.TERMINATED))
		}
	}

	#send<T = any>(data: { type: WorkerEventEnum, data?: any }, trans: Transferable[] = []): Promise<T> {
		return new Promise((resolve, reject) => {
			const id = getMessageID()
			this.#resolves[id] = resolve
			this.#rejects[id] = reject
			this.#worker.postMessage({ ...data, id }, trans)
		})
	}

	private initEvent() {
		this.#worker.onmessage = this.handleMessage.bind(this)
		this.#worker.onmessageerror = this.handleMessageError.bind(this)
	}

	private handleMessage({ data: { id, type, data } }: WorkerResponse) {
		switch (type) {
			case WorkerEventEnum.INIT:
				this.#loaded = true
				this.#resolves[id](data)
				break
			case WorkerEventEnum.FIND:
			case WorkerEventEnum.THUMBNAILS:
				this.#resolves[id](data)
				break
			case WorkerEventEnum.ERROR:
				this.#rejects[id](data)
				break
			case WorkerEventEnum.CLOSE:
		}
	}

	private handleMessageError(err: any) {
		console.error(err)
	}
}