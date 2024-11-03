import { applicationAvailable } from "./applicationAvailable"

describe("sanity checks for mocking", () => {
  // because it makes no sense to mock the actual implementation if we don't
  // know what it does in the current version, we better check what it's
  // expected to do
  it("can find neovim using the actual implementation", async () => {
    await expect(applicationAvailable("nvim")).resolves.toBe("nvim")
  })

  it("complains when a nonexistent command is checked", async () => {
    await expect(applicationAvailable("thisCommandDoesNotExist")).rejects.toBe(null)
  })
})
