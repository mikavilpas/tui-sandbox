import { assertType, it } from "vitest"
import * as z from "zod"
import type { MyNeovimConfigModification } from "./MyNeovimConfigModification.js"

const testDirectoryFiles = z.enum([
  "config-modifications/add_command_to_count_open_buffers.lua",
  "config-modifications/add_command_to_update_buffer_after_timeout.lua",
  "config-modifications/don't_crash_when_modification_contains_unescaped_characters\".lua",
  "config-modifications/subdir/subdir-modification.lua",
  "config-modifications/subdir",
  "config-modifications",
])
type MyTestDirectoryFile = z.infer<typeof testDirectoryFiles>

type result = MyNeovimConfigModification<MyTestDirectoryFile>

it("returns config-modifications recursively", () => {
  assertType<
    | "add_command_to_count_open_buffers.lua"
    | "add_command_to_update_buffer_after_timeout.lua"
    | "don't_crash_when_modification_contains_unescaped_characters\".lua"
    | "subdir/subdir-modification.lua"
    | "subdir"
  >(1 as unknown as result)
})
