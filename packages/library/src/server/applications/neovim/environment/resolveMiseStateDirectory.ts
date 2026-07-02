import { join } from "path"

/**
 * Resolves mise's state directory (which holds its trust database) from the
 * real environment, so the sandbox can reuse it despite overriding `$HOME`.
 *
 * mise resolves it as `$MISE_STATE_DIR`, else `${XDG_STATE_HOME:-$HOME/.local/state}/mise`
 * (see https://mise.jdx.dev/directories.html), which is what the branches below
 * replicate.
 */
export const resolveMiseStateDirectory = (realEnvironment: NodeJS.ProcessEnv = process.env): string | undefined => {
  if (realEnvironment["MISE_STATE_DIR"]) {
    return realEnvironment["MISE_STATE_DIR"]
  }
  if (realEnvironment["XDG_STATE_HOME"]) {
    return join(realEnvironment["XDG_STATE_HOME"], "mise")
  }
  if (realEnvironment["HOME"]) {
    return join(realEnvironment["HOME"], ".local", "state", "mise")
  }
  return undefined
}
