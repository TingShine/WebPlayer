import { Component } from "../component"

export class ProgressBar extends Component {
  private playerBar: HTMLDivElement
  private  bufferBar: HTMLDivElement

  constructor() {
    super()
    this.initDOM()
    this.initEvent()
  }

  setProgress(progress: number) {
    if (this.playerBar) {
      this.playerBar.style.width = `${progress}%`
      this.bufferBar.style.left = `${progress}%`
    }
  }

  setBufferProgress(ratio: number) {
    if (this.bufferBar) {
      this.bufferBar.style.width = `${ratio}%`
    }
  }

  private initDOM() {
    const progressBar = document.createElement('div')
    progressBar.style.width = "100%"
    progressBar.style.height = "3px"
    progressBar.style.backgroundColor = "#555"
    progressBar.style.position = "relative"
    progressBar.style.cursor = "pointer"

    const playerBar = document.createElement('div')
    playerBar.style.width = "0"
    playerBar.style.height = "100%"
    playerBar.style.backgroundColor = "white"
    playerBar.style.position = "absolute"
    playerBar.style.top = "0"
    playerBar.style.left = "0"
  
    const bufferBar = document.createElement('div')
    bufferBar.style.width = "0"
    bufferBar.style.height = "100%"
    bufferBar.style.backgroundColor = "#888"
    bufferBar.style.position = "absolute"
    bufferBar.style.top = "0"
    bufferBar.style.left = "0"

    this.wrapper = progressBar
    this.playerBar = playerBar
    this.bufferBar = bufferBar

    progressBar.appendChild(playerBar)
    progressBar.appendChild(bufferBar)
  }

  private initEvent() {
    this.wrapper.addEventListener("mouseover", () => {
      this.wrapper.style.height = '5px'
    })

    this.wrapper.addEventListener("mouseleave", () => {
      this.wrapper.style.height = '3px'
    })

    this.wrapper.addEventListener("click", (e) => {
      e.stopPropagation()
      e.preventDefault()
      
      const rect = this.wrapper.getBoundingClientRect()
      const x = e.clientX
      const ratio = (x - rect.x) / rect.width
      this.eventEmitter.emit("ui:progress", ratio)
    })
  }
}