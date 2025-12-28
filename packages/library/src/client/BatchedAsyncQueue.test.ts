import { describe, expect, it } from "vitest"
import { timeout } from "../server/utilities/timeout.js"
import { BatchedAsyncQueue } from "./BatchedAsyncQueue.js"

describe("BatchedAsyncQueue", () => {
  it("processes enqueued values in order", async () => {
    const controller = new AbortController()
    const processedValues: number[] = []
    const queue = new BatchedAsyncQueue<number>(async (batch: number[]) => {
      // Simulate some async processing
      await new Promise(resolve => setTimeout(resolve, 10))
      processedValues.push(...batch)
    }, controller.signal)

    // Start processing in the background
    void queue.startProcessing()

    // Enqueue some values
    queue.enqueue(1)
    queue.enqueue(2)
    queue.enqueue(3)

    // Wait a bit to allow processing to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check that values were processed in order
    expect(processedValues).toEqual([1, 2, 3])
  })

  it("aborts processing when signal is triggered", async () => {
    const controller = new AbortController()
    const processedValues: number[] = []
    const queue = new BatchedAsyncQueue<number>(async (batch: number[]) => {
      // Simulate some async processing
      await new Promise(resolve => setTimeout(resolve, 10))
      processedValues.push(...batch)
    }, controller.signal)

    // Start processing in the background
    void queue.startProcessing()

    // Enqueue some values
    queue.enqueue(1)
    queue.enqueue(2)

    // Wait a bit to allow processing to complete
    await poll(() => processedValues.length >= 2)

    // Abort further processing
    controller.abort()

    // Enqueue more values after abort
    queue.enqueue(3)
    queue.enqueue(4)

    // Wait a bit to see if any more processing occurs
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check that only the first two values were processed
    expect(processedValues).toEqual([1, 2])
  })

  const poll = async (condition: () => boolean) =>
    Promise.race([
      timeout(1000),
      (async () => {
        while (!condition()) {
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      })(),
    ])
})
