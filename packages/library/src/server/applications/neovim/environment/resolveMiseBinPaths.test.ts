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

it("no-ops when mise is not installed", () => {
  // Support cases where mise is used for local development but not installed
  // in CI.
  expect(
    resolveMiseBinPaths("/repo", {}, () => {
      throw Object.assign(new Error("(test) spawn mise ENOENT"), { code: "ENOENT" })
    }),
  ).toEqual([])
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
