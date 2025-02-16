import { Component, IStyleMap } from "../component"

export class ProgressBar extends Component {
  progressBar: HTMLDivElement
  playerBar: HTMLDivElement
  bufferBar: HTMLDivElement

  constructor() {
    super()
    this.initDOM()
  }

  public mount(wrap: HTMLElement, styles: CSSStyleDeclaration) {
    Object.keys(styles).forEach((key) => {
      this.progressBar.style[key] = styles[key]
    })
    wrap.appendChild(this.progressBar)
  }

  public unmount(wrap: HTMLElement): void {
    wrap.removeChild(this.progressBar)
  }

  private initDOM() {
    const progressBar = document.createElement('div')
    progressBar.style.width = "100%"
    progressBar.style.height = "4px"
    progressBar.style.backgroundColor = "#555"
    progressBar.style.position = "relative"

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

    this.progressBar =progressBar
    this.playerBar = playerBar
    this.bufferBar = bufferBar

    progressBar.appendChild(playerBar)
    progressBar.appendChild(bufferBar)
  }

  setProgress(progress: number, buffer: number) {
    if (this.playerBar) {
      this.playerBar.style.width = `${progress}%`
    }

    if (this.bufferBar) {
      this.bufferBar.style.width = `${buffer}%`
      this.bufferBar.style.left = `${progress}%`
    }
  }

  public destroy() {
    this.wrapper.removeChild(this.progressBar)
    this.wrapper = null
    this.progressBar = null
    this.playerBar = null
    this.bufferBar = null
  }
}