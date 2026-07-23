import type EventEmitter from "events"

export async function* convertEventEmitterToAsyncGenerator(
  emitter: EventEmitter,
  eventName: string,
): AsyncGenerator<string, void, unknown> {
  while (true) {
    // oxlint-disable-next-line no-await-in-loop - need to process sequentially
    yield await new Promise(resolve => {
      emitter.once(eventName, resolve)
    })
  }
}
