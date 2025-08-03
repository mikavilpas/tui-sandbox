import { describe, expect, it } from "vitest"
import { getCwd } from "./runBlockingShellCommand.js"

describe("getCwd", () => {
  it("prefers cwdRelative if it is defined", () => {
    // in many cases this is what the user wants to do, so prefer that

    const result = getCwd({
      rootPathAbsolute: "/root-absolute",
      cwdRelative: "test-cwd-relative",
      cwdAbsolute: "/test-cwd",
      home: "/test-home",
    })
    expect(result).toEqual("/root-absolute/test-cwd-relative")
  })

  it("falls back to cwd if cwdRelative is not defined", () => {
    // this is used when the user wants to use absolute paths

    const result = getCwd({
      rootPathAbsolute: "/root-absolute",
      cwdRelative: undefined,
      cwdAbsolute: "/test-cwd",
      home: "/test-home",
    })
    expect(result).toEqual("/test-cwd")
  })

  it("falls back to HOME if neither cwdRelative nor cwd are defined", () => {
    // if the user doesn't specify anything, we default to the home directory
    // because a directory must be present when running the command

    const result = getCwd({
      rootPathAbsolute: "/root-absolute",
      cwdRelative: undefined,
      cwdAbsolute: undefined,
      home: "/test-home",
    })
    expect(result).toEqual("/test-home")
  })
})
