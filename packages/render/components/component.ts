import type EventEmitter from "eventemitter3"

export class Component {
  protected eventEmitter: EventEmitter | null = null

  protected wrapper: HTMLDivElement | null

  public mount(dom: HTMLElement, styles: any) {
    if (this.wrapper) {
      Object.keys(styles).forEach((key: any) => {
        this.wrapper.style[key] = styles[key]
      })

      dom.appendChild(this.wrapper)
    }
  }

  public unmount(dom: HTMLElement) {
    if (this.wrapper) {
      dom.removeChild(this.wrapper)
      this.destroy()
    }
  }

  public register(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter
  }

  public destroy() {

  }
}
