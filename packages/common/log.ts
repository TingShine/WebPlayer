
export enum LogLevelEnum {
	LOG = 'log',
	WARN = 'warn',
	ERROR = 'error'
}

export class CommonLog {
	constructor(public prefix: string, public level = LogLevelEnum.LOG) {}

	get inner_prefix () {
		return `【${this.prefix}】`
	}

	public log(...args: any[]) {
		if (this.level !== LogLevelEnum.LOG) return

		console.log(`${this.inner_prefix} `, ...args)
	}

	public warn(...args: any[]) {
		if (this.level === LogLevelEnum.ERROR) return

		console.warn(`${this.inner_prefix} `, ...args)
	}

	public error(...args: any[]) {
		if (this.level !== LogLevelEnum.ERROR) return

		console.error(`${this.inner_prefix} `, ...args)
	}
}