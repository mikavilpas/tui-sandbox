import assert from "assert"
import path from "path"
import { describe, expect, it } from "vitest"
import { Lazy } from "../utilities/Lazy.js"
import { buildSchemaForDirectoryTree, getDirectoryTree } from "./index.js"

describe("dirtree", () => {
  const output = new Lazy(() =>
    getDirectoryTree(path.join(__dirname, "..", "..", "..", "..", "integration-tests", "test-environment"))
  )

  it("can get a list of all the files", () => {
    const result = output.get().allFiles

    assert(result)
    expect(result.length).toBeGreaterThan(1)
    assert(result[0])
    expect(result[0].relativePath).toBeTruthy()
  })

  it("should be able to build a typescript type for the tree", async () => {
    const result = await buildSchemaForDirectoryTree(output.get(), "MyDirectoryTree")

    expect(result).toMatchInlineSnapshot(`
      "
      // Note: This file is autogenerated. Do not edit it directly.
      //
      // Describes the contents of the test directory, which is a blueprint for
      // files and directories. Tests can create a unique, safe environment for
      // interacting with the contents of such a directory.
      //
      // Having strong typing for the test directory contents ensures that tests can
      // be written with confidence that the files and directories they expect are
      // actually found. Otherwise the tests are brittle and can break easily.

      import { z } from "zod"

      export const MyDirectoryTreeSchema = z.object({
        name: z.literal("test-environment/"),
        type: z.literal("directory"),
        contents: z.object({
          ".config": z.object({
            name: z.literal(".config/"),
            type: z.literal("directory"),
            contents: z.object({
              ".gitkeep": z.object({
                name: z.literal(".gitkeep"),
                type: z.literal("file"),
                extension: z.literal(""),
                stem: z.literal(".gitkeep"),
              }),
              nvim: z.object({
                name: z.literal("nvim/"),
                type: z.literal("directory"),
                contents: z.object({
                  "init.lua": z.object({
                    name: z.literal("init.lua"),
                    type: z.literal("file"),
                    extension: z.literal("lua"),
                    stem: z.literal("init."),
                  }),
                }),
              }),
            }),
          }),
          "config-modifications": z.object({
            name: z.literal("config-modifications/"),
            type: z.literal("directory"),
            contents: z.object({
              "add_command_to_count_open_buffers.lua": z.object({
                name: z.literal("add_command_to_count_open_buffers.lua"),
                type: z.literal("file"),
                extension: z.literal("lua"),
                stem: z.literal("add_command_to_count_open_buffers."),
              }),
            }),
          }),
          "dir with spaces": z.object({
            name: z.literal("dir with spaces/"),
            type: z.literal("directory"),
            contents: z.object({
              "file1.txt": z.object({
                name: z.literal("file1.txt"),
                type: z.literal("file"),
                extension: z.literal("txt"),
                stem: z.literal("file1."),
              }),
              "file2.txt": z.object({
                name: z.literal("file2.txt"),
                type: z.literal("file"),
                extension: z.literal("txt"),
                stem: z.literal("file2."),
              }),
            }),
          }),
          "file.txt": z.object({
            name: z.literal("file.txt"),
            type: z.literal("file"),
            extension: z.literal("txt"),
            stem: z.literal("file."),
          }),
          "initial-file.txt": z.object({
            name: z.literal("initial-file.txt"),
            type: z.literal("file"),
            extension: z.literal("txt"),
            stem: z.literal("initial-file."),
          }),
          "other-subdirectory": z.object({
            name: z.literal("other-subdirectory/"),
            type: z.literal("directory"),
            contents: z.object({
              "other-sub-file.txt": z.object({
                name: z.literal("other-sub-file.txt"),
                type: z.literal("file"),
                extension: z.literal("txt"),
                stem: z.literal("other-sub-file."),
              }),
            }),
          }),
          routes: z.object({
            name: z.literal("routes/"),
            type: z.literal("directory"),
            contents: z.object({
              "posts.$postId": z.object({
                name: z.literal("posts.$postId/"),
                type: z.literal("directory"),
                contents: z.object({
                  "adjacent-file.txt": z.object({
                    name: z.literal("adjacent-file.txt"),
                    type: z.literal("file"),
                    extension: z.literal("txt"),
                    stem: z.literal("adjacent-file."),
                  }),
                  "route.tsx": z.object({
                    name: z.literal("route.tsx"),
                    type: z.literal("file"),
                    extension: z.literal("tsx"),
                    stem: z.literal("route."),
                  }),
                  "should-be-excluded-file.txt": z.object({
                    name: z.literal("should-be-excluded-file.txt"),
                    type: z.literal("file"),
                    extension: z.literal("txt"),
                    stem: z.literal("should-be-excluded-file."),
                  }),
                }),
              }),
            }),
          }),
          subdirectory: z.object({
            name: z.literal("subdirectory/"),
            type: z.literal("directory"),
            contents: z.object({
              "subdirectory-file.txt": z.object({
                name: z.literal("subdirectory-file.txt"),
                type: z.literal("file"),
                extension: z.literal("txt"),
                stem: z.literal("subdirectory-file."),
              }),
            }),
          }),
        }),
      })

      export const MyDirectoryTreeContentsSchema = MyDirectoryTreeSchema.shape.contents
      export type MyDirectoryTreeContentsSchemaType = z.infer<typeof MyDirectoryTreeSchema>

      export type MyDirectoryTree = MyDirectoryTreeContentsSchemaType["contents"]

      export const testDirectoryFiles = z.enum([
        ".config/.gitkeep",
        ".config/nvim/init.lua",
        ".config/nvim",
        ".config",
        "config-modifications/add_command_to_count_open_buffers.lua",
        "config-modifications",
        "dir with spaces/file1.txt",
        "dir with spaces/file2.txt",
        "dir with spaces",
        "file.txt",
        "initial-file.txt",
        "other-subdirectory/other-sub-file.txt",
        "other-subdirectory",
        "routes/posts.$postId/adjacent-file.txt",
        "routes/posts.$postId/route.tsx",
        "routes/posts.$postId/should-be-excluded-file.txt",
        "routes/posts.$postId",
        "routes",
        "subdirectory/subdirectory-file.txt",
        "subdirectory",
        "."
      ])
      export type MyTestDirectoryFile = z.infer<typeof testDirectoryFiles>"
    `)
  })
})
