import { Component } from "../component";

const PLAY_SVG = `<?xml version="1.0" ?><!DOCTYPE svg  PUBLIC '-//W3C//DTD SVG 1.1//EN'  'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'><svg height="24px" id="Layer_1" style="enable-background:new 0 0 24 24;" version="1.1" viewBox="0 0 24 24" width="24px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><path d="M144,124.9L353.8,256L144,387.1V124.9 M128,96v320l256-160L128,96L128,96z" fill="#fff"/></g></svg>`
const PAUSE_SVG = `<?xml version="1.0" ?><svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7,2 L9,2 C10.1045695,2 11,2.8954305 11,4 L11,20 C11,21.1045695 10.1045695,22 9,22 L7,22 C5.8954305,22 5,21.1045695 5,20 L5,4 C5,2.8954305 5.8954305,2 7,2 Z M15,2 L17,2 C18.1045695,2 19,2.8954305 19,4 L19,20 C19,21.1045695 18.1045695,22 17,22 L15,22 C13.8954305,22 13,21.1045695 13,20 L13,4 C13,2.8954305 13.8954305,2 15,2 Z M7,4 L7,20 L9,20 L9,4 L7,4 Z M15,4 L15,20 L17,20 L17,4 L15,4 Z" fill-rule="evenodd" fill="#fff" /></svg>`

export class PlayButton extends Component {
	private state: 'Playing' | 'Pause' = 'Pause'

	constructor() {
		super()
		this.initDOM()
	}

	public play() {
		if (this.state === 'Playing') return

		this.wrapper.innerHTML = PAUSE_SVG
	}

	public pause() {
		if (this.state === 'Pause') return

		this.wrapper.innerHTML = PLAY_SVG
	}

	private initDOM() {
		const wrapper = document.createElement('div')
		wrapper.style.width = "24px"
		wrapper.style.height = "24px"
		wrapper.style.color = "white"
		wrapper.innerHTML = PLAY_SVG

		this.wrapper = wrapper
	}
}