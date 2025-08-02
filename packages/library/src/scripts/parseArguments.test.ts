import { parseArguments } from "./parseArguments.js"

it(`can parse "neovim prepare"`, async () => {
  expect(await parseArguments(["neovim", "prepare"])).toEqual({ action: "neovim prepare" })
  expect(await parseArguments(["neovim", "prepare", "foo"])).toBeUndefined()
})

describe("neovim exec", () => {
  it(`can parse "neovim exec <command>"`, async () => {
    expect(await parseArguments(["neovim", "exec", "foo"])).toEqual({ action: "neovim exec", command: "foo" })
  })

  it(`only allows one argument`, async () => {
    expect(await parseArguments(["neovim", "exec"])).toBeUndefined()
    expect(await parseArguments(["neovim", "exec", "foo", "bar"])).toBeUndefined()
  })
})

it(`can parse "start"`, async () => {
  expect(await parseArguments(["start"])).toEqual({ action: "start" })
  expect(await parseArguments(["start", "foo"])).toBeUndefined()
})
