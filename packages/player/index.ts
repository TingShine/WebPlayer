import type { PlayerEventEnum } from './constants'
import type { IPlayerOptions } from './types'
import EventEmitter from 'eventemitter3'
import { PlayerManager } from '../manager'
import { VideoRender } from '../render'
import { SyncManger } from '../sync'
import { ProgressBar } from '../render/components/progress'
import { TimeComponent } from '../render/components/time'
import { PlayButton } from '../render/components/button'
import { LoadingIcon } from '../render/components/loading'

export class WebPlayer {
	private eventEmitter = new EventEmitter<PlayerEventEnum>()
	private manager: PlayerManager
	private videoRender: VideoRender
	private syncManger: SyncManger
	private progressBar = new ProgressBar()
	private timeDisplay = new TimeComponent()
	private playButton = new PlayButton()
	private loadingIcon = new LoadingIcon()

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
		this.loadingIcon.mount(this.videoRender.wrapper, {
			"position": "absolute",
			"bottom": "50%",
			"left": "50%",
			"transform": "translate3d(-50%, -50%, 0)",
		})
		this.syncManger = new SyncManger({
			userEventEmitter: this.eventEmitter,
			manager: this.manager,
			videoRender: this.videoRender,
			timeDisplay: this.timeDisplay,
			playButton: this.playButton,
			progress: this.progressBar,
			loadingIcon: this.loadingIcon
		})
	}

	public play() {}

	public pause() {}

	public seek(timestamp: number) {}

	public destroy() {
		this.eventEmitter.removeAllListeners()
		this.manager.destroy()
		this.videoRender.destroy()
	}

	public addEventListener(event: PlayerEventEnum, callback: (...args: any[]) => void) {
		this.eventEmitter.on(event, callback)
	}

	public removeEventListener(event: PlayerEventEnum) {
		this.eventEmitter.off(event)
	}
}