# Changelog

## [9.1.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v9.0.1...library-v9.1.0) (2025-02-15)


### Features

* allow testing any terminal application, not just neovim ([#279](https://github.com/mikavilpas/tui-sandbox/issues/279)) ([e8e3654](https://github.com/mikavilpas/tui-sandbox/commit/e8e365419d80f6c93f36a9ff032299ce6dca0375))

## [9.0.1](https://github.com/mikavilpas/tui-sandbox/compare/library-v9.0.0...library-v9.0.1) (2025-01-24)


### Bug Fixes

* interlaced installDependencies output ([b255bcc](https://github.com/mikavilpas/tui-sandbox/commit/b255bcc24d3da7a2b55bac1b1c2473e3f7c5ea23))

## [9.0.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v8.0.2...library-v9.0.0) (2025-01-19)


### ⚠ BREAKING CHANGES

* simplify the schema for MyTestDirectory ([#251](https://github.com/mikavilpas/tui-sandbox/issues/251))

### Features

* simplify the schema for MyTestDirectory ([#251](https://github.com/mikavilpas/tui-sandbox/issues/251)) ([98f0e4f](https://github.com/mikavilpas/tui-sandbox/commit/98f0e4f9d3324a421ab6db3c81b50e6f578c0358))

## [8.0.2](https://github.com/mikavilpas/tui-sandbox/compare/library-v8.0.1...library-v8.0.2) (2025-01-18)


### Bug Fixes

* officially support cypress-14 ([#245](https://github.com/mikavilpas/tui-sandbox/issues/245)) ([b623e14](https://github.com/mikavilpas/tui-sandbox/commit/b623e1467ab3c10332b421582d9fd323244e7da5))

## [8.0.1](https://github.com/mikavilpas/tui-sandbox/compare/library-v8.0.0...library-v8.0.1) (2025-01-13)


### Bug Fixes

* relative import in cypress-support files ([#239](https://github.com/mikavilpas/tui-sandbox/issues/239)) ([cab59eb](https://github.com/mikavilpas/tui-sandbox/commit/cab59eb82e5b01b1ff190987ac6c315b37e29f25))

## [8.0.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v7.7.1...library-v8.0.0) (2025-01-13)


### ⚠ BREAKING CHANGES

* When a Neovim instance is started, tui-sandbox used to return the TestDirectory instance, which is the type-safe representation of the test directory's paths. The TestDirectory can now be found in a `.dir` property.

### Features

* make it more difficult to accidentally call unsupported cmds ([#237](https://github.com/mikavilpas/tui-sandbox/issues/237)) ([d5ca4c9](https://github.com/mikavilpas/tui-sandbox/commit/d5ca4c9c48172cf5cd0fc075fd185757508b96fe))


### Bug Fixes

* confusing error message when waiting for :messages to finish ([abc22c0](https://github.com/mikavilpas/tui-sandbox/commit/abc22c052f54a0d56fbab06ca75ee10a6f0b182f))

## [7.7.1](https://github.com/mikavilpas/tui-sandbox/compare/library-v7.7.0...library-v7.7.1) (2025-01-12)


### Bug Fixes

* warning timeouts about Neovim messages firing on success ([#231](https://github.com/mikavilpas/tui-sandbox/issues/231)) ([6b8f8af](https://github.com/mikavilpas/tui-sandbox/commit/6b8f8af56cbc201eda4988ec54a3256ac64e9ca5))

## [7.7.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v7.6.0...library-v7.7.0) (2025-01-12)


### Features

* create config-modifications directory if it doesn't exist ([1688f88](https://github.com/mikavilpas/tui-sandbox/commit/1688f88db821c73b499c1b0cb2f2ebe0fe221741))

## [7.6.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v7.5.6...library-v7.6.0) (2025-01-11)


### Features

* can run a prepare script before starting the tests ([#225](https://github.com/mikavilpas/tui-sandbox/issues/225)) ([53d1a32](https://github.com/mikavilpas/tui-sandbox/commit/53d1a32ff292f9a931a90fddceb5ec36a8dad84a))

## [7.5.6](https://github.com/mikavilpas/tui-sandbox/compare/library-v7.5.5...library-v7.5.6) (2025-01-09)


### Bug Fixes

* waiting forever for :messages to finish when neovim is stuck ([#218](https://github.com/mikavilpas/tui-sandbox/issues/218)) ([e8ef89b](https://github.com/mikavilpas/tui-sandbox/commit/e8ef89baddf36f468900ed7211bf7339e4f9042a))

## [7.5.5](https://github.com/mikavilpas/tui-sandbox/compare/library-v7.5.4...library-v7.5.5) (2025-01-01)


### Bug Fixes

* crash when using startupScriptModifications with `'` in the name ([bde5d06](https://github.com/mikavilpas/tui-sandbox/commit/bde5d06f37bc77c7276ac0db407640baeac87984))
* directory schema generation failing with unescaped chars ([bb9b89b](https://github.com/mikavilpas/tui-sandbox/commit/bb9b89b9f047cc4cd5f8a39018045d639a4dc3d2))

## [7.5.4](https://github.com/mikavilpas/tui-sandbox/compare/library-v7.5.3...library-v7.5.4) (2024-12-25)


### Bug Fixes

* remove debugger statement ([1c861a9](https://github.com/mikavilpas/tui-sandbox/commit/1c861a9f64a68f2d1776a4050d07ea4adf4fd293))

## [7.5.3](https://github.com/mikavilpas/tui-sandbox/compare/library-v7.5.2...library-v7.5.3) (2024-12-25)


### Bug Fixes

* not correctly failing tests ([2a6f737](https://github.com/mikavilpas/tui-sandbox/commit/2a6f737a5049f4f8adf8e322cc5e205b828e893a))

## [7.5.2](https://github.com/mikavilpas/tui-sandbox/compare/library-v7.5.1...library-v7.5.2) (2024-12-25)


### Bug Fixes

* not being able to throw error in Cypress.on("fail") handler ([5ec8596](https://github.com/mikavilpas/tui-sandbox/commit/5ec8596f4f13d0c3ad0bc684f66629311d5d057b))

## [7.5.1](https://github.com/mikavilpas/tui-sandbox/compare/library-v7.5.0...library-v7.5.1) (2024-12-25)


### Bug Fixes

* throw error on Cypress fail ([bbfd118](https://github.com/mikavilpas/tui-sandbox/commit/bbfd118ce1508facba8e59b0434b2bc9c67b3f45))

## [7.5.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v7.4.0...library-v7.5.0) (2024-12-24)


### Features

* when a test fails, show :messages output in the terminal ([1729dff](https://github.com/mikavilpas/tui-sandbox/commit/1729dff10b7f8c3b320621856df569a6873411d4))

## [7.4.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v7.3.0...library-v7.4.0) (2024-12-04)


### Features

* allow customizing the PORT for the test server ([#176](https://github.com/mikavilpas/tui-sandbox/issues/176)) ([a07a1ae](https://github.com/mikavilpas/tui-sandbox/commit/a07a1ae52d4ae67b323305891c3f9b2019f01bd4))

## [7.3.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v7.2.1...library-v7.3.0) (2024-11-30)


### Features

* can run a headless neovim ex-command before tests ([700d83c](https://github.com/mikavilpas/tui-sandbox/commit/700d83c6b19875e946b38ef382b9eb48e22cb5f6))

## [7.2.1](https://github.com/mikavilpas/tui-sandbox/compare/library-v7.2.0...library-v7.2.1) (2024-11-28)


### Bug Fixes

* annoying dev output when starting the server ([729d43d](https://github.com/mikavilpas/tui-sandbox/commit/729d43d5c773c3e856690ae5896fea56e138a4b9))

## [7.2.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v7.1.0...library-v7.2.0) (2024-11-24)


### Features

* add `cy.runExCommand()` to run Ex commands in Neovim ([#160](https://github.com/mikavilpas/tui-sandbox/issues/160)) ([1140f04](https://github.com/mikavilpas/tui-sandbox/commit/1140f04fcc86bd8bc90301a3505aef922c1a1f89))

## [7.1.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v7.0.1...library-v7.1.0) (2024-11-24)


### Features

* add `cy.runLuaCode()` for executing lua in the neovim instance ([#159](https://github.com/mikavilpas/tui-sandbox/issues/159)) ([04ac8eb](https://github.com/mikavilpas/tui-sandbox/commit/04ac8ebc0d95628da2ce601e361183b57804cb50))


### Bug Fixes

* remove black margins around the terminal ([ccc4ea3](https://github.com/mikavilpas/tui-sandbox/commit/ccc4ea30a5402e7c296eac9e242ba162b2e17952))

## [7.0.1](https://github.com/mikavilpas/tui-sandbox/compare/library-v7.0.0...library-v7.0.1) (2024-11-20)


### Bug Fixes

* abort test execution when shell commands fail by default ([#152](https://github.com/mikavilpas/tui-sandbox/issues/152)) ([cd8f97e](https://github.com/mikavilpas/tui-sandbox/commit/cd8f97ed2872328cc0c201d50400b4e5e81072cc))

## [7.0.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v6.1.0...library-v7.0.0) (2024-11-20)


### ⚠ BREAKING CHANGES

* it used to be the root of the test-environment, but this does not make much sense. Usually we want to operate within the unique test directory only.

### Features

* the default cwd for shell commands is the test directory ([#150](https://github.com/mikavilpas/tui-sandbox/issues/150)) ([9d8ec59](https://github.com/mikavilpas/tui-sandbox/commit/9d8ec59751bbbb831d188a26f9628b0f01bb65ed))

## [6.1.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v6.0.2...library-v6.1.0) (2024-11-19)


### Features

* neovim-client can run shell commands ([d5ae2b7](https://github.com/mikavilpas/tui-sandbox/commit/d5ae2b7be654f9e3d9b3c3e4788c292293f46bac))

## [6.0.2](https://github.com/mikavilpas/tui-sandbox/compare/library-v6.0.1...library-v6.0.2) (2024-11-18)


### Bug Fixes

* add prettier peer dependency to library package.json ([#143](https://github.com/mikavilpas/tui-sandbox/issues/143)) ([0f0bfff](https://github.com/mikavilpas/tui-sandbox/commit/0f0bfffc90d671acfe62a261b1c6f30bf1d4b36d))

## [6.0.1](https://github.com/mikavilpas/tui-sandbox/compare/library-v6.0.0...library-v6.0.1) (2024-11-17)


### Bug Fixes

* disable verbose cypress logging related to kbd&mouse input ([#141](https://github.com/mikavilpas/tui-sandbox/issues/141)) ([c170da2](https://github.com/mikavilpas/tui-sandbox/commit/c170da27053a292288cd915b02069e48b556caf1))

## [6.0.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v5.1.2...library-v6.0.0) (2024-11-17)


### ⚠ BREAKING CHANGES

* this changes the way that cypress support bindings are generated. Previously, you had to manually create a file in your cypress/support directory. Now, the file is automatically generated for you when you run `tui start`.

### Features

* automatically generate cypress support bindings on startup ([48cc416](https://github.com/mikavilpas/tui-sandbox/commit/48cc416dff628edbc850be4f31e7317c8a686217))

## [5.1.2](https://github.com/mikavilpas/tui-sandbox/compare/library-v5.1.1...library-v5.1.2) (2024-11-15)


### Bug Fixes

* startupScriptModifications were ignored entirely ([#133](https://github.com/mikavilpas/tui-sandbox/issues/133)) ([27d305a](https://github.com/mikavilpas/tui-sandbox/commit/27d305af63a9880a45900df241a8b6bf42185920))

## [5.1.1](https://github.com/mikavilpas/tui-sandbox/compare/library-v5.1.0...library-v5.1.1) (2024-11-15)


### Bug Fixes

* publish StartNeovimGenericArguments from types.ts ([#131](https://github.com/mikavilpas/tui-sandbox/issues/131)) ([d3ca31b](https://github.com/mikavilpas/tui-sandbox/commit/d3ca31bdd6eec9481840339209ec2fbc44a0f3b8))

## [5.1.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v5.0.0...library-v5.1.0) (2024-11-15)


### Features

* clean `testdirs/*` on startup ([#129](https://github.com/mikavilpas/tui-sandbox/issues/129)) ([65b3750](https://github.com/mikavilpas/tui-sandbox/commit/65b3750079118ac4dc70e05d49de02f729d6b5e1))

## [5.0.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v4.2.0...library-v5.0.0) (2024-11-14)


### ⚠ BREAKING CHANGES

* using the `test-setup.lua` file has been moved to `~/.config/nvim/init.lua` in favor of `init.lua`.

### Features

* Neovim supports the .config directory for user configuration ([#127](https://github.com/mikavilpas/tui-sandbox/issues/127)) ([d4cd7bc](https://github.com/mikavilpas/tui-sandbox/commit/d4cd7bce50e80c80ab7f1d6d786e069a173aa1d6))

## [4.2.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v4.1.0...library-v4.2.0) (2024-11-14)


### Features

* can pass environment variables to neovim from cypress tests ([#124](https://github.com/mikavilpas/tui-sandbox/issues/124)) ([1399c2e](https://github.com/mikavilpas/tui-sandbox/commit/1399c2eefd89fe7ac1fc7d17f469130a3ef7886b))

## [4.1.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v4.0.0...library-v4.1.0) (2024-11-12)


### Features

* add rgbify function to convert catppuccin colors to CSS colors ([#121](https://github.com/mikavilpas/tui-sandbox/issues/121)) ([64bc422](https://github.com/mikavilpas/tui-sandbox/commit/64bc42227e5784ecd326929e6f301124f1c0a712))

## [4.0.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v3.0.0...library-v4.0.0) (2024-11-12)


### ⚠ BREAKING CHANGES

* allow starting the server using `tui start` ([#118](https://github.com/mikavilpas/tui-sandbox/issues/118))

### Features

* allow starting the server using `tui start` ([#118](https://github.com/mikavilpas/tui-sandbox/issues/118)) ([7ac4e59](https://github.com/mikavilpas/tui-sandbox/commit/7ac4e59d5ad2fa5bf07a9fc132a92b96587ac227))

## [3.0.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v2.3.0...library-v3.0.0) (2024-11-08)


### ⚠ BREAKING CHANGES

* This change modifies the directory names in the MyTestDirectory file. To upgrade, run your tests once, and then commit the changes to that file. That's all.

### Features

* add `/` to the end of directory names to make it clear ([#114](https://github.com/mikavilpas/tui-sandbox/issues/114)) ([f40c912](https://github.com/mikavilpas/tui-sandbox/commit/f40c9129ad8ac5ec62bdf3276caead1606b2fedc))

## [2.3.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v2.2.0...library-v2.3.0) (2024-11-03)


### Features

* **wip:** allow access to neovim via a type safe socket connection ([#109](https://github.com/mikavilpas/tui-sandbox/issues/109)) ([1c4d919](https://github.com/mikavilpas/tui-sandbox/commit/1c4d9194ec8961bde0e8f84d500c27363c66a61b))

## [2.2.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v2.1.0...library-v2.2.0) (2024-11-03)


### Features

* check that neovim is available before starting the server ([#107](https://github.com/mikavilpas/tui-sandbox/issues/107)) ([bcc817f](https://github.com/mikavilpas/tui-sandbox/commit/bcc817fe25a9811cdd7b1832f6811fa4f92974bd))

## [2.1.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v2.0.2...library-v2.1.0) (2024-11-02)


### Features

* client connects to server using server-sent events ([e07765e](https://github.com/mikavilpas/tui-sandbox/commit/e07765e20dba6394538cf29b1b16463b62ba4b7a))

## [2.0.2](https://github.com/mikavilpas/tui-sandbox/compare/library-v2.0.1...library-v2.0.2) (2024-10-20)


### Bug Fixes

* zoomed in screen sizes could lose text ([#78](https://github.com/mikavilpas/tui-sandbox/issues/78)) ([4f3f659](https://github.com/mikavilpas/tui-sandbox/commit/4f3f659c404e9a93c8108f4359d049ddd573afd4))

## [2.0.1](https://github.com/mikavilpas/tui-sandbox/compare/library-v2.0.0...library-v2.0.1) (2024-10-02)


### Bug Fixes

* missing ws types ([#55](https://github.com/mikavilpas/tui-sandbox/issues/55)) ([f29863c](https://github.com/mikavilpas/tui-sandbox/commit/f29863cfe580c5418058d62aabb34eac509771ba))

## [2.0.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v1.3.0...library-v2.0.0) (2024-09-24)


### ⚠ BREAKING CHANGES

* add public client and server APIs ([#46](https://github.com/mikavilpas/tui-sandbox/issues/46))

### Features

* add public client and server APIs ([#46](https://github.com/mikavilpas/tui-sandbox/issues/46)) ([3f13f53](https://github.com/mikavilpas/tui-sandbox/commit/3f13f5386f31de9bb5bf6fc099e2e404261d31b0))

## [1.3.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v1.2.0...library-v1.3.0) (2024-09-23)


### Features

* add license (MIT) to library package ([#42](https://github.com/mikavilpas/tui-sandbox/issues/42)) ([8c72eb1](https://github.com/mikavilpas/tui-sandbox/commit/8c72eb13e17c5e6838220a5a16da0d44a6aba792))
* allow test dirs that have no contents ([#40](https://github.com/mikavilpas/tui-sandbox/issues/40)) ([863e9f0](https://github.com/mikavilpas/tui-sandbox/commit/863e9f0731b1565bf5f9afdb6834275598196f22))

## [1.2.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v1.1.0...library-v1.2.0) (2024-09-22)


### Features

* expose testEnvironmentPath in more detail ([#38](https://github.com/mikavilpas/tui-sandbox/issues/38)) ([53eedaa](https://github.com/mikavilpas/tui-sandbox/commit/53eedaaedba32924c57fe56a7bec6a6cc0140aa1))

## [1.1.0](https://github.com/mikavilpas/tui-sandbox/compare/library-v1.0.5...library-v1.1.0) (2024-09-22)


### Features

* log when building schema for test directory ([b8b0c7c](https://github.com/mikavilpas/tui-sandbox/commit/b8b0c7c1be0e0dacc9eb45c96308e706785e4a56))

## [1.0.5](https://github.com/mikavilpas/tui-sandbox/compare/library-v1.0.4...library-v1.0.5) (2024-09-22)


### Bug Fixes

* build errors ([0d7c07e](https://github.com/mikavilpas/tui-sandbox/commit/0d7c07eab5b683903026d266357e6a406212fb93))

## 1.0.4 (2024-09-22)


### Bug Fixes

* nerd font was not imported in the test environment ([4310530](https://github.com/mikavilpas/tui-sandbox/commit/431053069152baf030aa8cdc2c0f8f884f11e9c1))
* not being able to run tests inside the library package ([959da7d](https://github.com/mikavilpas/tui-sandbox/commit/959da7d48a71551edee0038fd99449fbe16747c2))
* not being able to start with a different neovim filename ([fd2c2e6](https://github.com/mikavilpas/tui-sandbox/commit/fd2c2e68d2dcbf3aed62d753312ea459da6e4668))
* unable to start without an existing directory schema ([2ab6862](https://github.com/mikavilpas/tui-sandbox/commit/2ab6862e5429c1e6e85e319296fb02506be1b4ae))


### Miscellaneous Chores

* fix release-please ([142bcff](https://github.com/mikavilpas/tui-sandbox/commit/142bcff65fbc42c69a9f8f2ee9fa725b4822fc66))
