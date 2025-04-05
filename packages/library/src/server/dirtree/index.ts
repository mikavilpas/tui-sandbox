import type { Dree } from "dree"
import { scan, Type } from "dree"
import { readlinkSync } from "fs"
import { format, resolveConfig } from "prettier"
import { fileURLToPath } from "url"
import { jsonToZod } from "./json-to-zod.js"

type TreeResult = { dree: Dree | undefined; allFiles: Dree[] }

/** Convert a directory tree to a TypeScript type. This is useful for testing
 * as the initial state of the test directory is fully known in tests. */
export function getDirectoryTree(path: string): TreeResult {
  const allFiles: Dree[] = []
  const result = scan(
    path,
    {
      exclude: [/.repro/, /testdirs/],
      hash: false,
      size: false,
      sizeInBytes: false,
    },
    file => {
      allFiles.push(file)
    },
    dir => {
      allFiles.push(dir)
    }
  ) as Dree | null // https://github.com/euberdeveloper/dree/pull/51

  return { dree: result ?? undefined, allFiles }
}

type TreeNode = FileNode | FileSymlinkNode | DirectoryNode

type FileNode = {
  type: "file"
  name: string
}
type FileSymlinkNode = {
  type: "file-symlink"
  name: string
  /** The target of the symlink, a filepath. */
  target: string
}
type DirectoryNode = {
  type: "directory"
  name: string
  contents: Record<string, TreeNode>
}

export function convertDree(root: Dree | undefined): TreeNode {
  if (!root) {
    return { type: Type.DIRECTORY, name: "root", contents: {} }
  }

  if (root.type === Type.FILE) {
    if (root.isSymbolicLink) {
      const target = readlinkSync(root.path)
      return {
        name: root.name,
        type: "file-symlink",
        target,
      } satisfies FileSymlinkNode
    }

    return {
      name: root.name,
      type: root.type,
    } satisfies FileNode
  }

  const node: DirectoryNode = {
    name: `${root.name}/`,
    type: root.type,
    contents: {},
  }
  for (const child of root.children || []) {
    node.contents[child.name] = convertDree(child)
  }

  return node
}

export async function buildSchemaForDirectoryTree(result: TreeResult, name: string): Promise<string> {
  const root = convertDree(result.dree)

  const schema = (await jsonToZod(root, `${name}Schema`)).split("\n")

  const lines = `
// Note: This file is autogenerated. Do not edit it directly.
//
// Describes the contents of the test directory, which is a blueprint for
// files and directories. Tests can create a unique, safe environment for
// interacting with the contents of such a directory.
//
// Having strong typing for the test directory contents ensures that tests can
// be written with confidence that the files and directories they expect are
// actually found. Otherwise the tests are brittle and can break easily.
`.split("\n")

  const allFilePaths = result.allFiles.map(f => f.relativePath)
  const ContentsSchema = `${name}ContentsSchema`
  const ContentsSchemaType = `${name}ContentsSchemaType`
  return [
    ...lines,
    ...schema,
    `export const ${ContentsSchema} = ${name}Schema.shape.contents`,
    `export type ${ContentsSchemaType} = z.infer<typeof ${name}Schema>`,
    "",
    `export type ${name} = ${ContentsSchemaType}["contents"]`,
    "",
    `export const testDirectoryFiles = z.enum(${JSON.stringify(allFilePaths, null, 2)})`,
    `export type MyTestDirectoryFile = z.infer<typeof testDirectoryFiles>`,
  ].join("\n")
}

const __filename = fileURLToPath(import.meta.url)

export async function buildTestDirectorySchema(testDirectoryPath: string): Promise<string> {
  console.log("Building schema for test directory", testDirectoryPath)
  const dree = getDirectoryTree(testDirectoryPath)
  let text = await buildSchemaForDirectoryTree(dree, "MyTestDirectory")

  const options = await resolveConfig(__filename)
  text = await format(text, { ...options, parser: "typescript" })

  return text
}
