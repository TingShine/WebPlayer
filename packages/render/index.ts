import EventEmitter from "eventemitter3";
import { PlayButton } from "./components/button";
import { ProgressBar } from "./components/progress";
import { TimeComponent } from "./components/time";
import type { IVideoRenderOptions } from "./type";

export class VideoRender extends EventEmitter {
	#prefix = "web-player"

	private wrapper: HTMLDivElement
	private canvas: HTMLCanvasElement
	private context: CanvasRenderingContext2D

	private overlay: HTMLDivElement
	private progressBar: ProgressBar
	private timeDisplay: TimeComponent
	private playButton: PlayButton

	private metadata = {
		width: 0,
		height: 0,
		duration: 0
	}
	
	constructor(private options: IVideoRenderOptions) {
		super()
		if (this.options.prefix) this.#prefix = this.options.prefix

		this.initDOM()
		this.initComponents()
	}

	public setMetaData(meta: any) {
		this.metadata = { ...this.metadata, ...meta }
		this.canvas.width = this.metadata.width
		this.canvas.height = this.metadata.height
		this.timeDisplay.setDuration(this.metadata.duration ?? 0)
		this.adjustCanvas()
	}

	public draw(vf: VideoFrame) {
		this.context.drawImage(vf, 0, 0)
	}

	public setProgress(val1: number, val2: number) {
		const currentTime = this.metadata.duration * val1 / 100
		this.progressBar.setProgress(val1, val2)
		this.timeDisplay.setCurrentTime(currentTime)
	}

	public destroy() {

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
		const ctx = canvas.getContext('2d')!
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
	}

	private initComponents() {
		const progressBar = new ProgressBar(this)
		progressBar.mount(this.overlay, {
			"position": "absolute",
			"bottom": "35px"
		})
		this.progressBar = progressBar

		const time = new TimeComponent(this)
		time.mount(this.overlay, {
			"position": "absolute",
			"bottom": "5px",
			"left": "40px"
		})
		this.timeDisplay = time

		const playButton = new PlayButton(this)
		playButton.mount(this.overlay, {
			"position": "absolute",
			"bottom": "5px"
		})
		this.playButton = playButton
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
