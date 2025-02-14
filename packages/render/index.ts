import { IVideoRenderOptions } from "./type";

export class VideoRender {
	#prefix = "web-player"

	private wrapper: HTMLDivElement
	private canvas: HTMLCanvasElement
	private context: CanvasRenderingContext2D

	private metadata = {
		width: 0,
		height: 0
	}
	
	constructor(private options: IVideoRenderOptions) {
		if (this.options.prefix) this.#prefix = this.options.prefix

		this.initDOM()
	}

	public setMetaData(meta) {
		this.metadata = { ...this.metadata, ...meta }
		this.canvas.width = this.metadata.width
		this.canvas.height = this.metadata.height
		this.adjustCanvas()
	}

	public draw(vf: VideoFrame) {
		this.context.drawImage(vf, 0, 0)
	}

	private initDOM() {
		const wrap = document.querySelector(this.options.container)
		if (!wrap) {
			throw new Error(`Could not found Element ${this.options.container}`)
		}

		const wrapper = document.createElement('div')
		wrapper.className = `${this.#prefix}-wrapper`
		wrapper.style.display = 'flex'
		wrapper.style.justifyContent = 'center'
		wrapper.style.alignItems = 'center'
		wrapper.style.width = this.options.width
		wrapper.style.height = this.options.height
		wrapper.style.background = "black"
		this.wrapper = wrapper

		const canvas = document.createElement('canvas')
		canvas.className = `${this.#prefix}-canvas`
		canvas.style.width = "100%"
		canvas.style.height = "100%"
		canvas.style.margin = 'auto'
		const ctx = canvas.getContext('2d')!
		this.context = ctx
		this.canvas = canvas

		this.wrapper.appendChild(canvas)
		wrap.appendChild(this.wrapper)
	}

	private adjustCanvas() {
		const rect = this.wrapper.getBoundingClientRect()
		const height = rect.height
		const width = rect.width
		const ratio = this.metadata.width / this.metadata.height
		if (ratio > width / height) {
			// 宽溢出，整体缩小画面
			this.canvas.style.height = `${width / ratio}`
			this.canvas.style.width = '100%'
		} else if (ratio < width / height) {
			// 高铺满，宽自适应
			this.canvas.style.height = '100%'
			this.canvas.style.width = `${ratio * height}px`
		} else {
			// 铺满画面
			this.canvas.style.width = '100%'
			this.canvas.style.height = '100%'
		}
	}
}
