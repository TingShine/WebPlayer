import EventEmitter from 'eventemitter3'
import { PlayerEventEnum } from '../player/constants'
import type { PlayerManager } from '../manager'
import type { ProgressBar } from '../render/components/progress'
import type { PlayButton } from '../render/components/button'
import type { TimeComponent } from '../render/components/time'
import type { VideoRender } from '../render'
import type { LoadingIcon } from '../render/components/loading'

interface ISyncParams{
	userEventEmitter: EventEmitter<PlayerEventEnum>
	manager: PlayerManager
	videoRender: VideoRender
	progress: ProgressBar
	playButton: PlayButton
	timeDisplay: TimeComponent
	loadingIcon: LoadingIcon
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
		ended: false,
		seeking: false,
	}

	constructor(private syncMap: ISyncParams) {
			super()
			this.register()
			this.initEvent()
	}

	public draw(vf: VideoFrame) {
		this.syncMap.videoRender.draw(vf)
		vf.close()
	}

	public setProgress(ratio: number) {
		this.syncMap.progress.setProgress(ratio)
		this.syncMap.timeDisplay.setCurrentTime(ratio / 100 * this.metadata.duration)
	}

	public setBufferProgress(ratio: number) {
		this.syncMap.progress.setBufferProgress(ratio)
	}

	private register() {
		for (const key of Object.keys(this.syncMap)) {
			if (key !== 'userEventEmitter' && key !== 'loadingIcon')
				this.syncMap[(key as keyof ISyncParams)]?.register(this)
		}
	}

	private initEvent() {
		this.on("ui:play", this.play.bind(this))
		this.on("ui:pause", this.pause.bind(this))
		this.on("ui:overlay-click", this.onOverlayClick.bind(this))
		this.on("ui:progress", this.onProgress.bind(this))
		this.on("canplay", this.onCanPlay.bind(this))
		this.on("ended", this.onEnded.bind(this))
		this.on("metadata", this.onMetaData.bind(this))
		this.on("seeked", this.onSeeked.bind(this))
	}

	private play() {
		if (this.state.loading) return

		if (this.syncMap.manager.isPlayEnd) {
			this.syncMap.manager.reset()
		}

		this.state.ended = false
		this.state.playing = true
		this.syncMap.manager.play()
		this.syncMap.userEventEmitter.emit(PlayerEventEnum.PLAY)
	}

	private pause() {
		if (this.state.loading) return

		this.state.playing = false
		this.syncMap.manager.pause()
		this.syncMap.userEventEmitter.emit(PlayerEventEnum.PAUSE)
	}

	private onMetaData(meta: { width: number, height: number, duration: number }) {
		this.metadata = meta
		this.syncMap.timeDisplay.setDuration(meta.duration)
		this.syncMap.videoRender.setMetaData(meta)
	}

	private onEnded() {
		this.setProgress(100)
		this.setBufferProgress(0)
		this.state.playing = false
		this.state.ended = true
		this.syncMap.playButton.pause()
		this.syncMap.userEventEmitter.emit(PlayerEventEnum.ENDED)
	}

	private onCanPlay(vf: VideoFrame) {
		this.state.loading = false
		this.syncMap.loadingIcon.destroy()
		this.syncMap.videoRender.draw(vf)
		this.syncMap.userEventEmitter.emit(PlayerEventEnum.CANPLAY)
	}

	private onOverlayClick() {
		if (this.state.loading) return

		this.syncMap.playButton.toggle()
	}

	private async onProgress(ratio: number) {
		if (this.state.loading) return

		const timestamp = ratio * this.metadata.duration
		this.syncMap.userEventEmitter.emit(PlayerEventEnum.SEEKING, timestamp)
		this.state.seeking = true
		this.syncMap.manager.seek(timestamp)
	}

	private onSeeked(vf: VideoFrame) {
		this.draw(vf)
		this.setProgress(vf.timestamp / (this.metadata.duration * 1e3) * 100)
		this.state.seeking = false
		this.syncMap.userEventEmitter.emit(PlayerEventEnum.SEEKED, vf.timestamp)

		if (this.state.playing) {
			this.syncMap.manager.play()
		}
	}
}