// This defines a way for the test runner to start Neovim. We need a way for
// the test runner to do this because it doesn't have direct access to either

import type { StartNeovimArguments } from "../library/server/types.ts"
import type { MyTestDirectory, testDirectoryFiles } from "../MyTestDirectory"

export type NeovimContext = {
  contents: MyTestDirectory
  /** provides easy access to all relative file paths from the root of the test
   * directory */
  files: (typeof testDirectoryFiles)["enum"]
}

declare global {
  interface Window {
    startNeovim(startArguments?: StartNeovimArguments): Promise<NeovimContext>
  }
}

export {}
