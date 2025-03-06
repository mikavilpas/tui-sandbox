export function timeout(ms: number): Promise<unknown> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
