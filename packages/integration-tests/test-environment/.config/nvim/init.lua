-- This files defines how to initialize the test environment for the
-- integration tests. It should be executed before running the tests.

-- this is used in some tests
_G.isInitFileLoaded = "yesTheInitFileIsLoaded"

-- Bootstrap lazy.nvim
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not (vim.uv or vim.loop).fs_stat(lazypath) then
  local lazyrepo = "https://github.com/folke/lazy.nvim.git"
  local out = vim.fn.system({
    "git",
    "clone",
    "--filter=blob:none",
    "--branch=stable",
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

-- install the following plugins
---@type LazySpec
local plugins = {
  {
    -- https://github.com/mason-org/mason-lspconfig.nvim?tab=readme-ov-file#recommended-setup-for-lazynvim
    "mason-org/mason-lspconfig.nvim",
    opts = {},
    config = function()
      ---@diagnostic disable-next-line: missing-fields
      require("mason-lspconfig").setup({
        -- make sure mason-lspconfig does not automatically enable any LSP
        -- servers that might be installed on the system. We want to only use the
        -- LSP servers that are included in the test setup.
        automatic_enable = false,
      })
      -- vim.lsp.config("emmylua_ls", {
      --   root_markers = {
      --     -- https://github.com/neovim/nvim-lspconfig/blob/master/lsp/emmylua_ls.lua
      --     ".luarc.json",
      --   },
      -- })
      vim.lsp.enable("emmylua_ls")
    end,
    dependencies = {
      { "mason-org/mason.nvim", opts = {} },
      "neovim/nvim-lspconfig",
    },
  },
  { "catppuccin/nvim", name = "catppuccin", priority = 1000 },
}
require("lazy").setup({ spec = plugins })

vim.keymap.set("n", "gd", vim.lsp.buf.definition)
vim.keymap.set("n", "gr", vim.lsp.buf.references)

vim.cmd.colorscheme("catppuccin-macchiato")

vim.lsp.log.set_level("debug")
-- require("vim.lsp.log").set_format_func(vim.inspect)
