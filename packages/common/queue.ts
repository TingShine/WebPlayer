
export interface QueueConfig {
	maxSize: number
	onSizeChange?: (length: number) => void
}

export class Queue<T = any> {
	#list: T[] = []

	constructor(private config: QueueConfig = { maxSize: Number.POSITIVE_INFINITY }) {}

	get canAddSize() {
		return this.config.maxSize - this.#list.length
	}

	get length() {
		return this.#list.length
	}

	setSizeChangeCallback(onSizeChange: (length: number) => void) {
		this.config.onSizeChange = onSizeChange
	}

	push(data: T) {
		this.#list.push(data)
		this.config.onSizeChange?.(1)
	}

	pushList(data: T[]) {
		this.#list.push(...data)
		this.config.onSizeChange?.(data.length)
	}

	pop() {
		if (this.#list.length) {
			const result = this.#list.pop() as T
			this.config.onSizeChange?.(-1)
			return result
		}

		return null
	}

	unshift(data: T) {
		this.#list.unshift(data)
		this.config.onSizeChange?.(1)
	}

	shift(): T | null {
		if (this.#list.length) {
			const result = this.#list.shift() as T
			this.config?.onSizeChange?.(-1)
			return result
		}

		return null
	}

	splice(start: number, length: number) {
		const result = this.#list.splice(start, length)
		this.config.onSizeChange?.(result.length)

		return result
	}

	at(pos: number) {
		return this.#list.at(pos)
	}

	clear() {
		const length = this.#list.length
		this.#list = []
		if (length) {
			this.config.onSizeChange?.(length)
		}
	}
}
