import { describe, expect, it } from "vitest"
import type { RgbColor } from "./color-utilities.js"
import { rgbify } from "./color-utilities.js"

describe("rgbify", () => {
  it("converts a catppuccin RGB color to a CSS color string", () => {
    const color = { r: 1, g: 2, b: 3 } satisfies RgbColor
    expect(rgbify(color)).toEqual("rgb(1, 2, 3)")
  })
})
