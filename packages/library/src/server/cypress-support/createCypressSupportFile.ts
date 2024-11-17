import { readFileSync, writeFileSync } from "fs"
import path from "path"
import { createCypressSupportFileContents } from "./contents.js"

export type CreateCypressSupportFileArgs = {
  cypressSupportDirectoryPath: string
  supportFileName: string
}

export type CreateCypressSupportFileResult = "updated" | "did-nothing"

/**
 * This is the interface of tui-sandbox as far as cypress in the user's
 * application is concerned. It needs to be checked for changes once per
 * tui-sandbox version.
 */
export async function createCypressSupportFile({
  cypressSupportDirectoryPath,
  supportFileName,
}: CreateCypressSupportFileArgs): Promise<CreateCypressSupportFileResult> {
  const text = await createCypressSupportFileContents()

  let oldSchema = ""
  const outputFilePath = path.join(cypressSupportDirectoryPath, supportFileName)
  try {
    oldSchema = readFileSync(outputFilePath, "utf-8")
  } catch (error) {
    console.log(`No existing cypress support file found at ${outputFilePath}, creating a new one`)
  }

  if (oldSchema !== text) {
    // it's important to not write the file if the schema hasn't changed
    // because file watchers will trigger on file changes and we don't want to
    // trigger a build if the schema hasn't changed
    writeFileSync(outputFilePath, text)
    return "updated"
  } else {
    return "did-nothing"
  }
}
