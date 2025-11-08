import type EventEmitter from "events"

export async function* convertEventEmitterToAsyncGenerator(
  emitter: EventEmitter,
  eventName: string
): AsyncGenerator<string, void, unknown> {
  while (true) {
    yield await new Promise(resolve => {
      emitter.once(eventName, resolve)
    })
  }
}
