
// Describes the contents of the test directory, which is a blueprint for
// files and directories. Tests can create a unique, safe environment for
// interacting with the contents of such a directory.
//
// Having strong typing for the test directory contents ensures that tests can
// be written with confidence that the files and directories they expect are
// actually found. Otherwise the tests are brittle and can break easily.

import { z } from "zod"

export const MyTestDirectorySchema = z.object({
  name: z.literal("test-environment"),
  type: z.literal("directory"),
  contents: z.object({
    "config-modifications": z.object({
      name: z.literal("config-modifications"),
      type: z.literal("directory"),
      contents: z.object({
        "add_command_to_count_open_buffers.lua": z.object({
          name: z.literal("add_command_to_count_open_buffers.lua"),
          type: z.literal("file"),
          extension: z.literal("lua"),
          stem: z.literal("add_command_to_count_open_buffers."),
        }),
        "disable_a_keybinding.lua": z.object({
          name: z.literal("disable_a_keybinding.lua"),
          type: z.literal("file"),
          extension: z.literal("lua"),
          stem: z.literal("disable_a_keybinding."),
        }),
        "modify_yazi_config_and_add_hovered_buffer_background.lua": z.object({
          name: z.literal("modify_yazi_config_and_add_hovered_buffer_background.lua"),
          type: z.literal("file"),
          extension: z.literal("lua"),
          stem: z.literal("modify_yazi_config_and_add_hovered_buffer_background."),
        }),
        "modify_yazi_config_and_highlight_buffers_in_same_directory.lua": z.object({
          name: z.literal("modify_yazi_config_and_highlight_buffers_in_same_directory.lua"),
          type: z.literal("file"),
          extension: z.literal("lua"),
          stem: z.literal("modify_yazi_config_and_highlight_buffers_in_same_directory."),
        }),
        "modify_yazi_config_and_open_multiple_files.lua": z.object({
          name: z.literal("modify_yazi_config_and_open_multiple_files.lua"),
          type: z.literal("file"),
          extension: z.literal("lua"),
          stem: z.literal("modify_yazi_config_and_open_multiple_files."),
        }),
        "modify_yazi_config_and_set_help_key.lua": z.object({
          name: z.literal("modify_yazi_config_and_set_help_key.lua"),
          type: z.literal("file"),
          extension: z.literal("lua"),
          stem: z.literal("modify_yazi_config_and_set_help_key."),
        }),
        "notify_hover_events.lua": z.object({
          name: z.literal("notify_hover_events.lua"),
          type: z.literal("file"),
          extension: z.literal("lua"),
          stem: z.literal("notify_hover_events."),
        }),
        "report_loaded_yazi_modules.lua": z.object({
          name: z.literal("report_loaded_yazi_modules.lua"),
          type: z.literal("file"),
          extension: z.literal("lua"),
          stem: z.literal("report_loaded_yazi_modules."),
        }),
        "use_light_neovim_colorscheme.lua": z.object({
          name: z.literal("use_light_neovim_colorscheme.lua"),
          type: z.literal("file"),
          extension: z.literal("lua"),
          stem: z.literal("use_light_neovim_colorscheme."),
        }),
      }),
    }),
    "dir with spaces": z.object({
      name: z.literal("dir with spaces"),
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
      name: z.literal("other-subdirectory"),
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
      name: z.literal("routes"),
      type: z.literal("directory"),
      contents: z.object({
        "posts.$postId": z.object({
          name: z.literal("posts.$postId"),
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
      name: z.literal("subdirectory"),
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
    "test-setup.lua": z.object({
      name: z.literal("test-setup.lua"),
      type: z.literal("file"),
      extension: z.literal("lua"),
      stem: z.literal("test-setup."),
    }),
  }),
})

export const MyTestDirectoryContentsSchema = MyTestDirectorySchema.shape.contents
export type MyTestDirectoryContentsSchemaType = z.infer<typeof MyTestDirectorySchema>

export type MyTestDirectory = MyTestDirectoryContentsSchemaType["contents"]