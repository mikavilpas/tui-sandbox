import assert from "node:assert"

export async function timeoutable<T>(timeoutMs: number, promise: Promise<T>): Promise<T> {
  let timeoutHandle: NodeJS.Timeout

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`))
    }, timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    assert(timeoutHandle!)
    clearTimeout(timeoutHandle)
  }
}
