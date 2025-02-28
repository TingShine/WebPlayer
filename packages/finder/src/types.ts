import type { WorkerEventEnum } from "./constants"

export interface IThumbnailsParams {
	start: number, end: number, step: number
}

export interface WorkerResponse {
	data: {
		id: number | string
		type: WorkerEventEnum
		data?: any
	}
}