

export abstract class Component {
  public abstract mount(dom: HTMLElement, styles: CSSStyleDeclaration): void

  public abstract unmount(dom: HTMLElement): void
}
