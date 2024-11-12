import type { flavors } from "@catppuccin/palette"

type RgbColor = (typeof flavors.macchiato.colors)["surface0"]["rgb"]

/** Convert a catppuccin RGB color to a CSS color string. This way you can
 * assert that text that's visible on the screen has a specific color. */
export function rgbify(color: RgbColor): string {
  return `rgb(${color.r.toString()}, ${color.g.toString()}, ${color.b.toString()})`
}
