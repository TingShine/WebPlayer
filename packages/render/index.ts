import type { IVideoRenderOptions } from "./type";
import type EventEmitter from 'eventemitter3'
export class VideoRender {
	#prefix = "web-player"

	public wrapper: HTMLDivElement
	private canvas: HTMLCanvasElement
	private context: CanvasRenderingContext2D

	public overlay: HTMLDivElement

	private eventEmitter: EventEmitter | null = null

	private metadata = {
		width: 0,
		height: 0,
		duration: 0
	}

	constructor(private options: IVideoRenderOptions) {
		if (this.options.prefix) this.#prefix = this.options.prefix

		this.initDOM()
	}

	public setMetaData(meta: any) {
		this.metadata = { ...this.metadata, ...meta }
		this.canvas.width = this.metadata.width
		this.canvas.height = this.metadata.height
		this.adjustCanvas()
	}

	public draw(vf: VideoFrame) {
		this.context.drawImage(vf, 0, 0)
	}


	public destroy() {
		if (!this.wrapper) return

		this.wrapper.remove()
		this.wrapper = null
		this.overlay = null
	}

	public register(event: EventEmitter) {
		this.eventEmitter = event
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
		wrapper.style.position = 'relative'
		wrapper.style.width = this.options.width
		wrapper.style.height = this.options.height
		wrapper.style.background = "black"
		this.wrapper = wrapper

		const canvas = document.createElement('canvas')
		canvas.className = `${this.#prefix}-canvas`
		canvas.style.width = "100%"
		canvas.style.height = "100%"
		canvas.style.margin = 'auto'
		const ctx = canvas.getContext('2d')
		this.context = ctx
		this.canvas = canvas

		const overlay = document.createElement('div')
		overlay.style.position = 'absolute'
		overlay.style.left = '20px'
		overlay.style.right = '20px'
		overlay.style.top = '10px'
		overlay.style.bottom = '10px'
		overlay.style.zIndex = '10'
		overlay.style.visibility = "hidden"
		this.overlay = overlay

		this.wrapper.appendChild(overlay)
		this.wrapper.appendChild(canvas)
		wrap.appendChild(this.wrapper)

		wrapper.addEventListener('mouseover', () => {
			overlay.style.visibility = "visible"
		})
		wrapper.addEventListener("mouseout", () => {
			overlay.style.visibility = "hidden"
		})
		overlay.addEventListener("click", (e) => {
			e.preventDefault()
			this.eventEmitter?.emit("ui:overlay-click")
		})
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
