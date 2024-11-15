/** Describes the contents of the test directory, which is a blueprint for
 * files and directories. Tests can create a unique, safe environment for
 * interacting with the contents of such a directory.
 *
 * Having strong typing for the test directory contents ensures that tests can
 * be written with confidence that the files and directories they expect are
 * actually found. Otherwise the tests are brittle and can break easily.
 */
export type TestDirectory = {
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

  contents: object
}

export type { StartNeovimGenericArguments } from "../server/neovim/NeovimApplication.js"
