import { describe, expect, it } from "vitest"
import { drawTextBox } from "./drawTextBox.js"

describe("drawTextBox", () => {
  it("draws a box around terminal content", () => {
    const content = [
      "",
      "The default interactive shell is now zsh.",
      "To update your account to use zsh, please run `chsh -s /bin/zsh`.",
      "For more details, please visit https://support.apple.com/kb/HT208050.",
      "myprompt ~ ➜",
    ].join("\n")

    expect(drawTextBox("Terminal content at failure", content)).toMatchInlineSnapshot(`
    "┌ Terminal content at failure ─────────────────────────────────────────────────────────┐
    │                                                                                      │
    │ The default interactive shell is now zsh.                                            │
    │ To update your account to use zsh, please run \`chsh -s /bin/zsh\`.                    │
    │ For more details, please visit https://support.apple.com/kb/HT208050.                │
    │ myprompt ~ ➜                                                                         │
    └──────────────────────────────────────────────────────────────────────────────────────┘"
  `)
  })

  it("expands the box when content is wider than the default width", () => {
    const longLine =
      "testdirs/dir-HME0bB/initial-file.txt                                                                        1,1            All"
    const content = ["If you see this text, Neovim is ready!", "~", longLine].join("\n")

    const result = drawTextBox("Terminal content at failure", content)
    const lines = result.split("\n")

    // All lines should be the same visual width
    const lengths = lines.map(line => line.length)
    expect(new Set(lengths).size).toBe(1)
  })
}) // describe
