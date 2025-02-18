import { PlayerEventEnum } from './constants'
import type { IPlayerOptions } from './types'
import EventEmitter from 'eventemitter3'
import { PlayerManager } from '../manager'
import { VideoRender } from '../render'
import { SyncManger } from '../sync'
import { ProgressBar } from '../render/components/progress'
import { TimeComponent } from '../render/components/time'
import { PlayButton } from '../render/components/button'

export class WebPlayer {
	private eventEmitter = new EventEmitter<PlayerEventEnum>()
	private manager: PlayerManager
	private videoRender: VideoRender
	private syncManger: SyncManger
	private progressBar = new ProgressBar()
	private timeDisplay = new TimeComponent()
	private playButton = new PlayButton()

	constructor(private options: IPlayerOptions) {
		this.videoRender = new VideoRender(options)
		this.manager = new PlayerManager(options)
		this.progressBar.mount(this.videoRender.overlay, {
			"position": "absolute",
			"bottom": "35px"
		})
		this.timeDisplay.mount(this.videoRender.overlay, {
			"position": "absolute",
			"bottom": "5px",
			"left": "40px"
		})
		this.playButton.mount(this.videoRender.overlay, {
			"position": "absolute",
			"bottom": "5px"
		})
		this.syncManger = new SyncManger({
			userEventEmitter: this.eventEmitter,
			manager: this.manager,
			videoRender: this.videoRender,
			timeDisplay: this.timeDisplay,
			playButton: this.playButton,
			progress: this.progressBar
		})
	}

	public play() {}

	public pause() {}

	public destroy() {
		this.eventEmitter.removeAllListeners()
		this.manager.destroy()
	}

	public addEventListener(event: PlayerEventEnum, callback: (...args: any[]) => void) {
		this.eventEmitter.on(event, callback)
	}

	public removeEventListener(event: PlayerEventEnum) {
		this.eventEmitter.off(event)
	}
}