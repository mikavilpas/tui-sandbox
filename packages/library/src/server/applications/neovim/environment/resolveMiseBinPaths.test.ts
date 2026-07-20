import { afterEach, expect, it } from "vitest"

import {
  clearMiseBinPathsCache,
  parseMiseBinPaths,
  prependMiseBinPathsToPath,
  resolveMiseBinPaths,
} from "./resolveMiseBinPaths.js"

afterEach(() => {
  clearMiseBinPathsCache()
})

it("parses newline-separated bin paths and ignores blank lines", () => {
  expect(parseMiseBinPaths("/a/bin\n/b/bin\n\n  /c/bin  \n")).toEqual(["/a/bin", "/b/bin", "/c/bin"])
})

it("resolves the parsed output of `mise bin-paths`", () => {
  const binPaths = resolveMiseBinPaths("/repo", {}, () => "/a/bin\n/b/bin\n")
  expect(binPaths).toEqual(["/a/bin", "/b/bin"])
})

it("memoizes per working directory (only shells out once)", () => {
  let calls = 0
  const run = (): string => {
    calls++
    return "/a/bin\n"
  }
  resolveMiseBinPaths("/repo", {}, run)
  resolveMiseBinPaths("/repo", {}, run)
  expect(calls).toBe(1)
})

it("crashes when mise is not installed", () => {
  // The mise integration is opt-in, so a failure here means the user asked for
  // mise but it could not be used. resolveMiseBinPaths must crash rather than
  // silently continue, so the misconfiguration is not hidden.
  expect(() =>
    resolveMiseBinPaths("/repo", {}, () => {
      throw Object.assign(new Error("spawn mise ENOENT"), { code: "ENOENT" })
    }),
  ).toThrow(/ENOENT/)
})

it("crashes when `mise bin-paths` exits non-zero", () => {
  expect(() =>
    resolveMiseBinPaths("/repo", {}, () => {
      throw new Error("Command failed")
    }),
  ).toThrow(/Command failed/)
})

it("prepends bin paths so mise-managed tools win over system copies", () => {
  const env = prependMiseBinPathsToPath({ PATH: "/usr/bin:/bin" }, ["/mise/lazygit/bin", "/mise/delta/bin"])
  expect(env["PATH"]).toBe("/mise/lazygit/bin:/mise/delta/bin:/usr/bin:/bin")
})

it("leaves the env untouched when there are no bin paths", () => {
  const original = { PATH: "/usr/bin", HOME: "/home/user" }
  expect(prependMiseBinPathsToPath(original, [])).toEqual(original)
})

it("handles a missing PATH", () => {
  expect(prependMiseBinPathsToPath({ HOME: "/home/user" }, ["/mise/lazygit/bin"])).toEqual({
    HOME: "/home/user",
    PATH: "/mise/lazygit/bin",
  })
})
