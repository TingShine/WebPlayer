
import type { IFetcherInput } from '../../fetcher/type'
import { CodecsExtractFrameModule } from './classes'
import { WorkerEventEnum } from './constants'

declare global {
	interface WorkerGlobalScope extends Worker {
		instance: CodecsExtractFrameModule
	}
}

declare const self: WorkerGlobalScope

self.instance = new CodecsExtractFrameModule()

self.onmessage = async ({ data: { type, id, data: _data } }) => {
	let result: any
	const transferable: Transferable[] = []

	try {
		switch (type) {
			case WorkerEventEnum.INIT:
				result = await self.instance.load(_data as IFetcherInput)
				break;
			case WorkerEventEnum.FIND:
				result = await self.instance.find(_data as number)
				if (result) transferable.push(result)
				break;
			case WorkerEventEnum.THUMBNAILS:
				result = await self.instance.thumbnails(_data)
				transferable.push(...result)
				break
			case WorkerEventEnum.CLOSE:
				self.instance.destroy()
				break
			default:
		}

		self.postMessage({ type, data: result, id }, transferable)
	} catch (err) {
		self.postMessage({ type: WorkerEventEnum.ERROR, data: err, id })
	}
}
