import type { VimValue } from "neovim/lib/types/VimValue.js"
import * as z from "zod"

/** Describes the contents of the test directory, which is a blueprint for
 * files and directories. Tests can create a unique, safe environment for
 * interacting with the contents of such a directory.
 *
 * Having strong typing for the test directory contents ensures that tests can
 * be written with confidence that the files and directories they expect are
 * actually found. Otherwise the tests are brittle and can break easily.
 */
export type TestDirectory<TContents extends Record<string, unknown> = Record<string, unknown>> = {
  /** The path to the unique test directory (the root).
   *
   * @example /Users/mikavilpas/git/tui-sandbox/packages/integration-tests/test-environment/testdirs/dir-0199UZ
   */
  rootPathAbsolute: string

  /** The path to the test environment directory, which is the blueprint for
   *
   * the test directory.
   * @example /Users/mikavilpas/git/tui-sandbox/packages/integration-tests/test-environment
   * */
  testEnvironmentPath: string

  /** The relative path from the {@link testEnvironmentPath} to {@link rootPathAbsolute}.
   *
   * @example testdirs/dir-0199UZ/
   */
  testEnvironmentPathRelative: string

  latestEnvironmentSymlink: string

  contents: TContents
}

export const serverTestDirectorySchema = z.object({
  rootPathAbsolute: z.string(),
  testEnvironmentPath: z.string(),
  testEnvironmentPathRelative: z.string(),
  latestEnvironmentSymlink: z.string(),
  contents: z.record(z.string(), z.unknown()),
})
export type ServerTestDirectory = z.infer<typeof serverTestDirectorySchema>

export type TestEnvironmentCommonEnvironmentVariables = {
  HOME: string

  // this is needed so that the application being tested can load its
  // configuration, emulating a common setup real users have
  XDG_CONFIG_HOME: string

  // the data directory is where the application stores its data. To prevent
  // downloading a new set of plugins/whatever for each test, share the data
  // directory.
  XDG_DATA_HOME: string
}

export type { StartNeovimGenericArguments } from "./applications/neovim/NeovimApplication.js"

export type BlockingShellCommandOutput =
  | {
      type: "success"
      stdout: string
      stderr: string
    }
  | {
      type: "failed"
      // for now we log the error to the server's console output. It will be
      // visible when running the tests.
    }

export type RunLuaCodeOutput = {
  value?: VimValue
  // to catch errors, use pcall() in the Lua code
}

export type RunExCommandOutput = { value?: string }

/**
 * Require all of an object's keys to be set explicitly. This is useful for
 * readability: writing all the keys makes their presence explicit. They could
 * also be added via a spread operator (...obj), but in that case the following
 * cases are unclear:
 *
 * - extra keys might be included because TypeScript does not check for them
 * - if the target object type has optional keys, they might be missing. In
 *   this case, they will never get set
 **/
export type AllKeys<T extends Record<never, never>> = Record<keyof T, unknown>
