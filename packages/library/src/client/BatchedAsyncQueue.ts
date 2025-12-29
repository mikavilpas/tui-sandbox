export type TerminalInputEvent = { key: string; domEvent: KeyboardEvent }

export class BatchedAsyncQueue<T> {
  /** The values currently in the queue. They will be processed in the next
   * batch. */
  private values: T[] = []

  /** A promise indicating that we are waiting for new values to be enqueued. */
  private waiting: PromiseWithResolvers<void> | undefined = undefined

  public constructor(
    private readonly processBatch: (values: T[]) => Promise<void>,
    private readonly signal: AbortSignal
  ) {}

  enqueue(value: T): void {
    this.values.push(value)

    if (this.waiting) {
      // resolve the promise to wake up the iterator. This continues execution
      // at the `await` in the iterator.
      this.waiting.resolve()
      this.waiting = undefined
    }
  }

  public async startProcessing(): Promise<void> {
    while (!this.signal.aborted) {
      if (this.values.length === 0) {
        // park the iterator until a new value is available
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        this.waiting = Promise.withResolvers<void>()
        await this.waiting.promise // wait for it to be resolved
        continue
      }

      // collect all pending values and process them as a batch. Remove the
      // values from the queue so that they are not processed again.
      const batch = this.values.splice(0, this.values.length)
      await this.processBatch(batch)
    }
  }
}
