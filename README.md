# 🧪 A terminal test environment and development playground 🛝

[![NPM Version](https://img.shields.io/npm/v/%40tui-sandbox%2Flibrary?logo=npm)](https://www.npmjs.com/package/@tui-sandbox/library)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)
![Neovim](https://img.shields.io/badge/Neovim-57A143?logo=neovim&logoColor=fff)

tui-sandbox is a framework for using the [cypress](https://www.cypress.io/) browser testing tool to run tests against
terminal applications.

![example of tui-sandbox being used in [yazi.nvim](https://github.com/mikavilpas/yazi.nvim) tests](documentation/images/yazi-example.webp)

> ☝🏻 example of tui-sandbox running Neovim with [yazi.nvim](https://github.com/mikavilpas/yazi.nvim). The yazi.nvim
> Neovim plugin shows the terminal file manager [yazi](https://github.com/sxyazi/yazi/) in a floating window inside
> Neovim, and tests their full integration exactly as a user interacts with them.

## The problems tui-sandbox solves

Modern terminal applications are complex. They often depend on external programs as well as the network and filesystem.
The development ecosystem is also diverse, spanning many different toolchains.

As a developer, it is difficult to

1. Ensure that all contributors have the same development environment
2. Write tests that are reliable, easy to maintain, and easily understood

tui-sandbox can solve these issues:

### Develop terminal applications in a live environment

The preview is fully interactive. You can use your application exactly as you would normally, including mouse clicks.
When you update your test, the tests automatically rerun with the latest changes.

You can also isolate the development and testing from your own config

- your own development setup is kept separate from the test environment
- each test has its own instance of the application
- each test has its own mini directory structure. This makes the tests more maintainable and discoverable.
  - The directory structure is also available as a TypeScript type, so you get completions and type errors in your
    tests.

![example of a type-safe test environment in tui-sandbox](documentation/images/type-safe-test-environment-example.webp)

> ☝🏻 Neovim using the type-safe test environment provided by tui-sandbox. The language server offers completions for the
> available file paths along with some metadata.

### Write and run integration tests for terminal applications

Using [cypress](https://www.cypress.io/) gives us great features for free, such as:

- automatically waiting for asynchronous things to happen
- make assertions on many things
  - test the terminal colors that are visible
  - images might work too, but I haven't tried them yet 😄
  - emoji are supported 👍🏻
- time travel debugging
- access to screenshots and videos of the test run in case it fails
- type safety with TypeScript

## Limitations

The main limitation is that tui-sandbox is much slower for running tests than a unit testing tool. It trades performance
for the ability to run tests in a live environment (giving very strong guarantees that the tests are valid).

For example, it takes 70 seconds to run 40 test cases in yazi.nvim (1.75s per test). In contrast, it takes 0.21 seconds
to run 110 unit tests in the same project (0.002s per test).

_Note that this is true for any unit/integration test comparison in general, so I recommend using both._

## Getting started

Even though it's being used in a nontrivial project, this framework is not very mature yet. If you are interested in
using it, please reach out to me via github issues. I would love to help.

Example projects that use tui-sandbox:

- [yazi.nvim](https://github.com/mikavilpas/yazi.nvim): Neovim plugin for file manager integration
- [blink-ripgrep.nvim](https://github.com/mikavilpas/blink-ripgrep.nvim): Neovim plugin for
  [ripgrep](https://github.com/BurntSushi/ripgrep) search results
