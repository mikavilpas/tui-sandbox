import { tabIdSchema } from 'library/server/utilities/tabId'
import { z } from 'zod'

export type FileEntry = {
  /** The name of the file and its extension.
   * @example "file.txt"
   */
  name: string

  /** The name of the file without its extension.
   * @example "file"
   */
  stem: string

  /** The extension of the file.
   * @example ".txt"
   */
  extension: string
}

/** Describes the contents of the test directory, which is a blueprint for
 * files and directories. Tests can create a unique, safe environment for
 * interacting with the contents of such a directory.
 *
 * Having strong typing for the test directory contents ensures that tests can
 * be written with confidence that the files and directories they expect are
 * actually found. Otherwise the tests are brittle and can break easily.
 */
export type TestDirectory<TFile extends string = string> = {
  /** The path to the unique test directory (the root). */
  rootPathAbsolute: string

  /** The path to the unique test directory, relative to the root of the
   * test-environment directory. */
  rootPathRelativeToTestEnvironmentDir: string

  contents: Record<TFile, FileEntry>
}

/** The arguments given from the tests to send to the server */
export const startNeovimArguments = z.object({
  filename: z
    .union([
      z.string(),
      z.object({
        openInVerticalSplits: z.array(z.string()),
      }),
    ])
    .optional(),
  startupScriptModifications: z.array(z.string()).optional(),
})
export type StartNeovimArguments = z.infer<typeof startNeovimArguments>

/** The arguments given to the server */
export const startNeovimServerArguments = z.intersection(
  z.object({
    tabId: tabIdSchema,
    terminalDimensions: z
      .object({
        cols: z.number(),
        rows: z.number(),
      })
      .optional(),
  }),
  startNeovimArguments
)
export type StartNeovimServerArguments = z.infer<typeof startNeovimServerArguments>
