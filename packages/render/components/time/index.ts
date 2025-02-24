import { Component } from "../component";

export class TimeComponent extends Component {
	private duration = 0
	private currentTime = 0

	private get innerText() {
		return `${formatTime(this.currentTime)} / ${formatTime(this.duration)}`
	}

	constructor() {
		super()
		this.initDOM()
	}

	public setDuration(time: number) {
		this.duration = time
		this.wrapper.innerText = this.innerText
	}

	public setCurrentTime(time: number) {
		this.currentTime = time
		this.wrapper.innerText = this.innerText
	}

	private initDOM() {
		const wrapper = document.createElement('div')
		wrapper.style.fontSize = "16px"
		wrapper.style.color = "white"
		wrapper.innerText = this.innerText
		this.wrapper = wrapper
	}
}

const formatTime = (time: number) => {
	const seconds = Math.floor(time / 1e3)
	const minutes = Math.floor(seconds / 60)
	const remainingSeconds = seconds % 60

	const result = minutes + ":" + (remainingSeconds < 10 ? "0" : "") + remainingSeconds
	return result
}