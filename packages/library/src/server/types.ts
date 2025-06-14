import type { VimValue } from "neovim/lib/types/VimValue.js"

/** Describes the contents of the test directory, which is a blueprint for
 * files and directories. Tests can create a unique, safe environment for
 * interacting with the contents of such a directory.
 *
 * Having strong typing for the test directory contents ensures that tests can
 * be written with confidence that the files and directories they expect are
 * actually found. Otherwise the tests are brittle and can break easily.
 */
export type TestDirectory<TContents extends object = object> = {
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

  contents: TContents
}

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
