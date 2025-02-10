
export enum ErrorTypeEnum {
}

const errMsgMap = new Map<ErrorTypeEnum, string>([
])

export class CustomError extends Error {

	constructor(public errorType: ErrorTypeEnum, private customMsg: string = '') {
		super()
	}

	get message() {
		return this.customMsg || errMsgMap.get(this.errorType) || ''
	}
}
