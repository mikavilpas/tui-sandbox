import assert from 'assert'
import type { Dree } from 'dree'
import { scan, Type } from 'dree'
import { jsonToZod } from './json-to-zod/json-to-zod'

/** Convert a directory tree to a TypeScript type. This is useful for testing
 * as the initial state of the test directory is fully known in tests. */
export function getDirectoryTree(path: string): Dree {
  const result = scan(path, {
    exclude: [/.repro/, /testdirs/],
    hash: false,
    size: false,
    sizeInBytes: false,
  })

  return result
}

type FileNode = {
  type: Type.FILE
  name: string
  extension: string | undefined
  stem: string
}
type DirectoryNode = {
  type: Type.DIRECTORY
  name: string
  contents: Record<string, TreeNode>
}

type TreeNode = FileNode | DirectoryNode

function convertDree(root: Dree): TreeNode {
  if (root.type === Type.FILE) {
    return {
      name: root.name,
      type: root.type,
      extension: root.extension,
      stem: root.extension ? root.name.slice(0, -root.extension.length) : root.name,
    }
  }

  assert(root.children)
  const node: DirectoryNode = {
    name: root.name,
    type: root.type,
    contents: {},
  }
  for (const child of root.children) {
    node.contents[child.name] = convertDree(child)
  }

  return node
}

export async function buildSchemaForDirectoryTree(root: Dree, name: string): Promise<string> {
  assert(root.type === Type.DIRECTORY)
  const json = convertDree(root)

  const lines = `
// Describes the contents of the test directory, which is a blueprint for
// files and directories. Tests can create a unique, safe environment for
// interacting with the contents of such a directory.
//
// Having strong typing for the test directory contents ensures that tests can
// be written with confidence that the files and directories they expect are
// actually found. Otherwise the tests are brittle and can break easily.
`.split('\n')

  const schema = (await jsonToZod(json, `${name}Schema`)).split('\n')

  return [...lines, ...schema, `export type ${name}Type = z.infer<typeof ${name}Schema>`].join('\n')
}

export async function buildTestDirectorySchema(path: string): Promise<string> {
  const dree = getDirectoryTree(path)
  return buildSchemaForDirectoryTree(dree, 'MyTestDirectory')
}
