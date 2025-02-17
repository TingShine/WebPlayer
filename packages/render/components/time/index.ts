import { Component } from "../component";

export class TimeComponent extends Component {
	private duration: number = 0
	private currentTime: number = 0

	private get innerText() {
		return `${formatTime(this.currentTime)} / ${formatTime(this.duration)}`
	}

	constructor() {
		super()
		this.initDOM()
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