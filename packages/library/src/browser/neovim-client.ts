import { NeovimClient } from "../client/index.js"
import type { StartNeovimGenericArguments } from "../server/neovim/NeovimApplication.js"
import type { TestDirectory } from "../server/types.js"

const app = document.querySelector<HTMLElement>("#app")
if (!app) {
  throw new Error("No app element found")
}

const client = new NeovimClient(app)

/** Entrypoint for the test runner (cypress) */
window.startNeovim = async function (startArgs?: StartNeovimGenericArguments): Promise<TestDirectory> {
  const testDirectory = await client.startNeovim({
    filename: startArgs?.filename ?? "initial-file.txt",
    startupScriptModifications: startArgs?.startupScriptModifications ?? [],
  })

  return testDirectory
}

declare global {
  interface Window {
    startNeovim(startArguments?: StartNeovimGenericArguments): Promise<TestDirectory>
  }
}
