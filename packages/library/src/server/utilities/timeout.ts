export function timeout(ms: number): Promise<unknown> {
  return new Promise((_, reject) => setTimeout(reject, ms))
}
