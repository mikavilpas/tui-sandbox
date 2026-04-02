import { existsSync } from "fs"
import { createRequire } from "module"
import { dirname, join } from "path"

/**
 * Resolve the native zerobox binary path. Prefers the platform-specific
 * native binary over the shell shim so that node-pty talks directly to
 * the Rust process (better PTY passthrough).
 */
export const resolveZeroboxBinary = (): string => {
  const require = createRequire(import.meta.url)

  // Try platform-specific native binary first
  const platform = process.platform
  const arch = process.arch
  const pkgName = `@zerobox/cli-${platform}-${arch}`

  try {
    const pkgJson = require.resolve(`${pkgName}/package.json`)
    const nativeBin = join(dirname(pkgJson), "zerobox")
    if (existsSync(nativeBin)) {
      return nativeBin
    }
  } catch {
    // Package not installed, fall through
  }

  // Fallback to the shell shim
  const shimPath = join(import.meta.dirname, "..", "..", "..", "..", "..", "node_modules", ".bin", "zerobox")
  if (existsSync(shimPath)) {
    return shimPath
  }

  throw new Error("Could not find zerobox binary. Install it with: pnpm add zerobox")
}
