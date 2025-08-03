import { access } from "fs/promises"
import { attach } from "neovim"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import type { PollingInterval } from "./NeovimJavascriptApiClient.js"
import { connectNeovimApi } from "./NeovimJavascriptApiClient.js"

vi.mock("neovim")
vi.mock("fs/promises")

const mocked = {
  attach: vi.mocked(attach),
  access: vi.mocked(access),
  log: vi.spyOn(console, "log").mockImplementation(() => {
    //
  }),
}
const pollingInterval = 100 satisfies PollingInterval

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

it("is lazy - does not connect right away", async () => {
  mocked.access.mockRejectedValue(new Error("no such file or directory"))
  connectNeovimApi("foosocket")

  vi.advanceTimersByTime(pollingInterval)
  expect(mocked.attach).not.toHaveBeenCalled()
})

it("connects right away if the socket file is already there", async () => {
  mocked.access.mockResolvedValue(undefined)
  const lazyClient = connectNeovimApi("foosocket")
  await lazyClient.get()

  vi.advanceTimersByTime(pollingInterval)
  expect(mocked.attach).toHaveBeenCalledWith({
    socket: "foosocket",
    options: {
      logger: expect.any(Object) as never,
    },
  } satisfies Partial<Parameters<typeof attach>[0]>)
  expect(mocked.attach).toHaveBeenCalledTimes(1)
})
