// This defines a way for the test runner to start Neovim. We need a way for
// the test runner to do this because it doesn't have direct access to either

import type { StartNeovimArguments } from "../library/server/types.ts"
import type { MyTestDirectory } from "../MyTestDirectory.ts"

// the server or the client.
declare global {
  interface Window {
    startNeovim(startArguments?: StartNeovimArguments): Promise<MyTestDirectory>
  }
}

export {}
