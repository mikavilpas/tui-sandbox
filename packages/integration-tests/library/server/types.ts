import { z } from "zod"
import { MyTestDirectoryContentsSchema, testDirectoryFiles } from "../../MyTestDirectory"

/** Describes the contents of the test directory, which is a blueprint for
 * files and directories. Tests can create a unique, safe environment for
 * interacting with the contents of such a directory.
 *
 * Having strong typing for the test directory contents ensures that tests can
 * be written with confidence that the files and directories they expect are
 * actually found. Otherwise the tests are brittle and can break easily.
 */
export type TestDirectory = {
  /** The path to the unique test directory (the root). */
  rootPathAbsolute: string
  contents: object
}

/** The arguments given from the tests to send to the server */
export const myStartNeovimArguments = z.object({
  filename: z
    .union([
      testDirectoryFiles,
      z.object({
        openInVerticalSplits: z.array(testDirectoryFiles),
      }),
    ])
    .optional(),
  startupScriptModifications: z
    .array(z.enum(MyTestDirectoryContentsSchema.shape["config-modifications"].shape.contents.keyof().options))
    .optional(),
})
