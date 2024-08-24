import z from 'zod'

export type MyTestDirectoryFile = z.infer<typeof myTestDirectoryFile>

export const myTestDirectoryFile = z.enum([
  'initial-file.txt',
  'file.txt',
  'test-setup.lua',
  'subdirectory/subdirectory-file.txt',
  'other-subdirectory/other-sub-file.txt',
  'dir with spaces/file1.txt',
  'dir with spaces/file2.txt',
  'routes/posts.$postId/route.tsx',
  'routes/posts.$postId/adjacent-file.txt',
  'routes/posts.$postId/should-be-excluded-file.txt',
])

export type MyIntegrationTestFile = '.' | MyTestDirectoryFile

export type MyStartupScriptModification = z.infer<typeof myStartupScriptModification>

export const myStartupScriptModification = z.enum([
  'modify_yazi_config_and_add_hovered_buffer_background.lua',
  'use_light_neovim_colorscheme.lua',
  'modify_yazi_config_and_set_help_key.lua',
  'disable_a_keybinding.lua',
  'notify_hover_events.lua',
  'modify_yazi_config_and_highlight_buffers_in_same_directory.lua',
  'modify_yazi_config_and_open_multiple_files.lua',
  'add_command_to_count_open_buffers.lua',
])
