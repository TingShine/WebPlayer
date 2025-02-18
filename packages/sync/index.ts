import EventEmitter from 'eventemitter3'
import { PlayerEventEnum } from '../player/constants'
import { PlayerManager } from '../manager'
import { ProgressBar } from '../render/components/progress'
import { PlayButton } from '../render/components/button'
import { TimeComponent } from '../render/components/time'
import { VideoRender } from '../render'

interface ISyncParams{
	userEventEmitter: EventEmitter<PlayerEventEnum>
	manager: PlayerManager
	videoRender: VideoRender
	progress: ProgressBar
	playButton: PlayButton
	timeDisplay: TimeComponent
}

/** 同步事件，以便兼容worker */
export class SyncManger extends EventEmitter {
	private metadata = {
		width: 0,
		height: 0,
		duration: 0
	}

	private state = {
		playing: false,
		loading: true,
		ended: false
	}

	constructor(private syncMap: ISyncParams) {
			super()
			this.register()
			this.initEvent()
	}

	public draw(vf: VideoFrame) {
		this.syncMap.videoRender.draw(vf)
	}

	public setProgress(ratio: number) {
		this.syncMap.progress.setProgress(ratio)
		this.syncMap.timeDisplay.setCurrentTime(ratio / 100 * this.metadata.duration)
	}

	public setBufferProgress(ratio: number) {
		this.syncMap.progress.setBufferProgress(ratio)
	}

	private register() {
		Object.keys(this.syncMap).forEach((key: keyof ISyncParams) => {
			if (key !== 'userEventEmitter' && key !== 'videoRender')
				this.syncMap[key]?.register(this)
		})
	}

	private initEvent() {
		this.on("ui:play", this.play.bind(this))
		this.on("ui:pause", this.pause.bind(this))
		this.on("canplay", this.onCanPlay.bind(this))
		this.on("ended", this.onEnded.bind(this))
		this.on("metadata", this.onMetaData.bind(this))
	}

	private play() {
		if (this.syncMap.manager.isPlayEnd) {
			this.syncMap.manager.reset()
		}

		this.syncMap.manager.play()
		this.syncMap.userEventEmitter.emit(PlayerEventEnum.PLAY)
	}

	private pause() {
		this.syncMap.manager.pause()
		this.syncMap.userEventEmitter.emit(PlayerEventEnum.PAUSE)
	}

	private onMetaData(meta: { width: number, height: number, duration: number }) {
		this.metadata = meta
		this.syncMap.timeDisplay.setDuration(meta.duration)
		this.syncMap.videoRender.setMetaData(meta)
	}

	private onEnded() {
		this.syncMap.playButton.pause()
		this.syncMap.userEventEmitter.emit(PlayerEventEnum.ENDED)
	}

	private onCanPlay(vf: VideoFrame) {
		this.syncMap.videoRender.draw(vf)
		this.syncMap.userEventEmitter.emit(PlayerEventEnum.CANPLAY)
	}
}