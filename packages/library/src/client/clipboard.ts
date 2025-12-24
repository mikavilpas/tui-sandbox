import type { ClipboardSelectionType, IClipboardProvider } from "@xterm/addon-clipboard"

export type InMemoryClipboard = {
  /**
   * Get the system clipboard contents. This seems to be the default on osx. If
   * you know what other systems use this by default, please open an issue or
   * PR to enhance this documentation!
   */
  system(): string

  /** Get the primary clipboard contents. */
  primary(): string
}

export class InMemoryClipboardProvider implements IClipboardProvider, InMemoryClipboard {
  private clipboardContents: Record<ClipboardSelectionType, string> = {
    c: "", // SYSTEM
    p: "", // PRIMARY
  }

  public system(): string {
    return this.clipboardContents.c
  }

  public primary(): string {
    return this.clipboardContents.p
  }

  async readText(selection: ClipboardSelectionType): Promise<string> {
    return this.clipboardContents[selection]
  }

  async writeText(selection: ClipboardSelectionType, text: string): Promise<void> {
    this.clipboardContents[selection] = text
  }
}
