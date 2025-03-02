export async function timeoutable<T>(ms: number, promise: Promise<T>): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined = undefined
  const timeout = new Promise<void>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timeout after ${ms}ms`))
    }, ms)
  })

  try {
    await Promise.race([timeout, promise])
    return await promise
  } finally {
    clearTimeout(timeoutId) // Ensure the timeout is cleared
  }
}
