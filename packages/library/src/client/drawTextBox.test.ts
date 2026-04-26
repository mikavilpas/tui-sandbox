import { describe, expect, it } from "vitest"
import { drawTextBox } from "./drawTextBox.js"
import { visualWidth } from "./visualWidth.js"

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

  it("right-aligns the border when content contains wide CJK characters", () => {
    // "日本" is 4 cells (2 wide chars at 2 cells each); "abcd" is also 4
    // cells. JS .length differs (2 vs 4) but visual width must match across
    // all box lines so the right border lines up.
    const content = ["日本", "abcd"].join("\n")
    const lines = drawTextBox("Title", content).split("\n")
    const widths = lines.map(visualWidth)
    expect(new Set(widths).size).toBe(1)
  })

  it("right-aligns the border when the title contains wide characters", () => {
    const lines = drawTextBox("日本語タイトル", "content").split("\n")
    const widths = lines.map(visualWidth)
    expect(new Set(widths).size).toBe(1)
  })

  it("right-aligns the border for emoji content", () => {
    const content = ["🎉🎉", "ab"].join("\n")
    const lines = drawTextBox("Title", content).split("\n")
    const widths = lines.map(visualWidth)
    expect(new Set(widths).size).toBe(1)
  })

  it("right-aligns the border for ZWJ-joined emoji clusters", () => {
    // 👨‍👩‍👧‍👦 is one grapheme (2 cells) built from 4 code points + ZWJs
    // (11 JS chars total). Naive .length math would over-pad by 9.
    const content = ["👨‍👩‍👧‍👦", "ab"].join("\n")
    const lines = drawTextBox("Title", content).split("\n")
    const widths = lines.map(visualWidth)
    expect(new Set(widths).size).toBe(1)
  })

  it("renders a tight box around CJK content", () => {
    // Snapshot — verifies the right border `│` actually lines up visually
    // when the file is viewed in a monospace context. minWidth=20 forces
    // the box to be sized by content rather than the default minimum.
    const content = ["日本", "abcd"].join("\n")
    expect(drawTextBox("T", content, 20)).toMatchInlineSnapshot(`
      "┌ T ───────────────┐
      │ 日本             │
      │ abcd             │
      └──────────────────┘"
    `)
  })
}) // describe
