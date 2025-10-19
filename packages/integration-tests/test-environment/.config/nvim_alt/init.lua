---@module "lazy"

-- This files defines how to initialize the test environment for the
-- integration tests. It should be executed before running the tests.

-- this is used in some tests
_G.isInitFileLoaded_alt = "yesTheInitFileIsLoaded"

-- renovate: datasource=github-releases depName=folke/lazy.nvim
local lazy_version = "v11.17.1"

-- Bootstrap lazy.nvim
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not (vim.uv or vim.loop).fs_stat(lazypath) then
  local lazyrepo = "https://github.com/folke/lazy.nvim.git"
  local out = vim.fn.system({
    "git",
    "clone",
    "--filter=blob:none",
    "--branch=" .. lazy_version,
    lazyrepo,
    lazypath,
  })
  if vim.v.shell_error ~= 0 then
    vim.api.nvim_echo({
      { "Failed to clone lazy.nvim:\n", "ErrorMsg" },
      { out, "WarningMsg" },
      { "\nPress any key to exit..." },
    }, true, {})
    vim.fn.getchar()
    os.exit(1)
  end
end
vim.opt.rtp:prepend(lazypath)

-- Make sure to setup `mapleader` and `maplocalleader` before
-- loading lazy.nvim so that mappings are correct.
-- This is also a good place to setup other settings (vim.opt)
vim.g.mapleader = " "
vim.g.maplocalleader = " "
vim.o.swapfile = false

require("lazy").setup({
  ---@type LazySpec
  { "lewis6991/gitsigns.nvim", opts = {} },
  { "catppuccin/nvim", name = "catppuccin", priority = 1000 },
})

vim.cmd.colorscheme("catppuccin-latte")
