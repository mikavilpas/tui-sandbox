import { execFileSync } from "child_process"
import path from "path"
import { debuglog } from "util"

const log = debuglog("tui-sandbox.mise")

/**
 * Resolves the bin directories of the currently active, installed mise tools.
 *
 * IMPORTANT: resolve this from the *real* server environment, never from the
 * isolated terminal env.
 *
 * NOTE: the selection of tools is assumed stable for the lifetime of the
 * server process - if you change the mise toolset, you must restart the server
 * to pick up new bin paths.
 *
 * Issue:
 *
 * The test terminal runs in a lightly-isolated environment, where a mise
 * *shim* cannot reliably re-resolve a tool -> version -> backend, so invoking
 * e.g. `lazygit` through its shim fails with "lazygit is not a valid shim" /
 * "No version is set for shim".
 *
 * Solution:
 *
 * Put the tools' real install dirs directly on `$PATH` so they become plain
 * executables, working around the issue.
 */
export type RunMiseBinPaths = (cwd: string, environment: NodeJS.ProcessEnv) => string

const runMiseBinPaths: RunMiseBinPaths = (cwd, environment) =>
  execFileSync("mise", ["bin-paths"], {
    cwd,
    env: environment,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })

/** Parses the newline-separated output of `mise bin-paths`. */
export const parseMiseBinPaths = (stdout: string): string[] =>
  stdout
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)

// `mise bin-paths` is stable for the lifetime of the server process. Memoize
// per working directory to avoid shelling out when starting every test.
const cache = new Map<string, string[]>()

export const resolveMiseBinPaths = (
  cwd: string = process.cwd(),
  environment: NodeJS.ProcessEnv = process.env,
  run: RunMiseBinPaths = runMiseBinPaths,
): string[] => {
  const cached = cache.get(cwd)
  if (cached) return cached

  const binPaths: string[] = parseMiseBinPaths(run(cwd, environment))
  log(`Resolved ${binPaths.length} mise bin path(s) from ${cwd}`)
  cache.set(cwd, binPaths)
  return binPaths
}

/** @private Test-only: forget memoized results so each test resolves fresh. */
export const clearMiseBinPathsCache = (): void => {
  cache.clear()
}

export const prependMiseBinPathsToPath = (env: Record<string, string>, binPaths: string[]): Record<string, string> => {
  if (binPaths.length === 0) return env
  const existing = env["PATH"] ?? ""
  return {
    ...env,
    PATH: [...binPaths, ...(existing ? [existing] : [])].join(path.delimiter),
  }
}
