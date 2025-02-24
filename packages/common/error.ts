
export enum ErrorTypeEnum {
	UN_LOADED = 'unloaded',
	TERMINATED = 'terminated'
}

const errMsgMap = new Map<ErrorTypeEnum, string>([
	[ErrorTypeEnum.UN_LOADED, "The instance has not loaded data, please invoke `load` method first"],
	[ErrorTypeEnum.TERMINATED, "Error occurs due to manually terminated"]
])

export class CustomError extends Error {

	constructor(public errorType: ErrorTypeEnum, private customMsg = '') {
		super()
	}

	get message() {
		return this.customMsg || errMsgMap.get(this.errorType) || ''
	}
}
