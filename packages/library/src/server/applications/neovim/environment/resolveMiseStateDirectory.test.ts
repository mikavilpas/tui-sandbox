import { expect, it } from "vitest"

import { resolveMiseStateDirectory } from "./resolveMiseStateDirectory.js"

it("prefers MISE_STATE_DIR when set", () => {
  expect(
    resolveMiseStateDirectory({ MISE_STATE_DIR: "/custom/state", XDG_STATE_HOME: "/xdg", HOME: "/home/user" })
  ).toBe("/custom/state")
})

it("falls back to $XDG_STATE_HOME/mise", () => {
  expect(resolveMiseStateDirectory({ XDG_STATE_HOME: "/xdg", HOME: "/home/user" })).toBe("/xdg/mise")
})

it("falls back to $HOME/.local/state/mise", () => {
  expect(resolveMiseStateDirectory({ HOME: "/home/user" })).toBe("/home/user/.local/state/mise")
})

it("returns undefined when nothing is set (mise keeps its default behaviour)", () => {
  expect(resolveMiseStateDirectory({})).toBeUndefined()
})
