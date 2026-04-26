/** Join row text into a snapshot, dropping trailing blank rows. */
export const extractTerminalContent = (rowTexts: ReadonlyArray<string>): string | undefined => {
  if (rowTexts.length === 0) return undefined

  const lines = [...rowTexts]
  while (lines.length > 0 && lines[lines.length - 1]?.trim() === "") {
    lines.pop()
  }

  return lines.length > 0 ? lines.join("\n") : undefined
}
