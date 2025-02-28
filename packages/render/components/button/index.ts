import { Component } from "../component";

const PLAY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#F3F3F3"><path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z"/></svg>`
const PAUSE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#F3F3F3"><path d="M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z"/></svg>`

export class PlayButton extends Component {
	private state: 'Playing' | 'Pause' = 'Pause'

	constructor() {
		super()
		this.initDOM()
		this.initEvent()
	}

	public play() {
		if (this.state === 'Playing') return

		this.state = 'Playing'
		this.wrapper.innerHTML = PAUSE_SVG
	}

	public pause() {
		if (this.state === 'Pause') return

		this.state = 'Pause'
		this.wrapper.innerHTML = PLAY_SVG
	}

	public toggle() {
		this.eventEmitter?.emit(this.state === "Playing" ? "ui:pause" : 'ui:play')
		this.wrapper.innerHTML = this.state === "Playing" ? PLAY_SVG : PAUSE_SVG
		this.state = this.state === "Playing" ? "Pause" : "Playing"
	}

	private initDOM() {
		const wrapper = document.createElement('div')
		wrapper.style.width = "24px"
		wrapper.style.height = "24px"
		wrapper.style.color = "white"
		wrapper.style.cursor = "pointer"
		wrapper.innerHTML = PLAY_SVG

		this.wrapper = wrapper
	}

	private initEvent() {
		this.wrapper.addEventListener('click', (e) => {
			e.preventDefault()
			e.stopPropagation()
			this.toggle()
		})
	}
}