import { describe, expect, it, vi } from "vitest"
import type { StartableApplication } from "./DisposableSingleApplication.js"
import { DisposableSingleApplication } from "./DisposableSingleApplication.js"
import type { ExitInfo } from "./TerminalApplication.js"

vi.spyOn(console, "log").mockImplementation(vi.fn())

class TestDisposableSingleApplication extends DisposableSingleApplication {
  public getApplication() {
    return this.application
  }
}

const fakeApp = {
  processId: 123,
  write: vi.fn(),
  killAndWait: vi.fn(),
  untilExit: Promise.resolve<ExitInfo>({ exitCode: 0, signal: undefined }),
} satisfies StartableApplication

describe("DisposableSingleApplication", () => {
  it("has no application when created", () => {
    const app = new TestDisposableSingleApplication()
    expect(app.processId()).toBeUndefined()
    expect(app.getApplication()).toBeUndefined()
  })

  it("can start an application", async () => {
    const app = new TestDisposableSingleApplication()
    await app.startNextAndKillCurrent(async () => fakeApp)
    expect(app.processId()).toBe(123)
    expect(app.getApplication()).toBe(fakeApp)
  })

  it("can write to the application", async () => {
    const app = new TestDisposableSingleApplication()
    await app.startNextAndKillCurrent(async () => fakeApp)
    await app.write("hello")
    expect(fakeApp.write).toHaveBeenCalledWith("hello")
  })

  it("fails to write if the application is not started", async () => {
    // there is no need to support soft failing in the ui, so we do hard
    // failing to make this error obvious
    const app = new TestDisposableSingleApplication()
    await expect(app.write("hello")).rejects.toThrowErrorMatchingInlineSnapshot(
      `[AssertionError: The application not started yet. It makes no sense to write to it, so this looks like a bug.]`
    )
  })

  describe("untilExit allows waiting for the application to exit", () => {
    it("successful exit works", async () => {
      const app = new TestDisposableSingleApplication()
      await app.startNextAndKillCurrent(async () => fakeApp)
      fakeApp.untilExit = Promise.resolve({ exitCode: 1, signal: 9 })
      await expect(app.untilExit()).resolves.toStrictEqual({
        exitCode: 1,
        signal: 9,
      } satisfies ExitInfo)
    })

    it("when the application throws an error, the error is propagated", async () => {
      const app = new TestDisposableSingleApplication()
      await app.startNextAndKillCurrent(async () => fakeApp)
      fakeApp.untilExit = Promise.reject(new Error("fake error"))
      await expect(app.untilExit()).rejects.toThrowError(new Error("fake error"))
    })
  })

  describe("disposing", () => {
    it("disposes the application when disposed", async () => {
      // it's important to make sure there are no dangling applications when
      // starting new tests or ending the user session entirely and closing the
      // application
      const app = new TestDisposableSingleApplication()

      await app.startNextAndKillCurrent(async () => fakeApp)
      expect(app.getApplication()).toBe(fakeApp)

      await app[Symbol.asyncDispose]()
      expect(fakeApp.killAndWait).toHaveBeenCalledOnce()
    })

    it("does nothing if there is no application to dispose", async () => {
      const app = new TestDisposableSingleApplication()
      expect(app.getApplication()).toBeUndefined()
      expect(app.processId()).toBeUndefined()

      expect(() => app[Symbol.asyncDispose]()).not.toThrow()
    })
  })
})
