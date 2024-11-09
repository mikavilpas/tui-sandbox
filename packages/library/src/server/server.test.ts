import { createAppRouter } from "./server.js"
import { applicationAvailable } from "./utilities/applicationAvailable.js"

vi.mock("./utilities/applicationAvailable")

const mocked = {
  applicationAvailable: vi.mocked(applicationAvailable),
}

describe("Neovim server", () => {
  it("complains when neovim is not installed", async () => {
    await expect(
      createAppRouter({
        outputFilePath: "outputFilePath",
        testEnvironmentPath: "testEnvironmentPath",
      })
    ).rejects.toThrow("Neovim is not installed. Please install Neovim (nvim).")

    expect(mocked.applicationAvailable).toHaveBeenCalledWith("nvim")
  })

  it("creates a router when neovim is installed", async () => {
    mocked.applicationAvailable.mockResolvedValue("nvim")

    await expect(
      createAppRouter({
        outputFilePath: "outputFilePath",
        testEnvironmentPath: "testEnvironmentPath",
      })
    ).resolves.toBeDefined()

    expect(mocked.applicationAvailable).toHaveBeenCalledWith("nvim")
  })
})
