import { EventEmitter } from "stream"
import { describe, expect, it } from "vitest"
import { convertEventEmitterToAsyncGenerator } from "./generator.js"

describe("when a listener is attached", () => {
  it("forwards events from an EventEmitter to an async generator", async () => {
    const eventEmitter = new EventEmitter()
    const generator = convertEventEmitterToAsyncGenerator(eventEmitter, "test")

    {
      const promise = generator.next()
      eventEmitter.emit("test", "message")

      expect(await promise).toMatchInlineSnapshot(`
        {
          "done": false,
          "value": "message",
        }
      `)

      const promise2 = generator.next()
      eventEmitter.emit("test", "message2")

      expect(await promise2).toMatchInlineSnapshot(`
        {
          "done": false,
          "value": "message2",
        }
      `)
    }
  })
})

describe("when no listener is attached, messages are lost permanently", () => {
  it("does not resend lost events after a subscriber attaches", async () => {
    const eventEmitter = new EventEmitter()
    eventEmitter.emit("test", "this message should be lost")

    const generator = convertEventEmitterToAsyncGenerator(eventEmitter, "test")
    const promise = generator.next()
    eventEmitter.emit("test", "new message that will be received")

    expect(await promise).toMatchInlineSnapshot(`
      {
        "done": false,
        "value": "new message that will be received",
      }
    `)
  })
})
