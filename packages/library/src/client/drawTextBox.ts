/** Draw a Unicode box around text content with a title in the top border. */
export const drawTextBox = (title: string, content: string, minWidth = 88): string => {
  const header = ` ${title} `
  const contentLines = content.split("\n")

  // The box must be wide enough for the header and all content lines
  const maxContentWidth = Math.max(...contentLines.map(line => line.length))
  const width = Math.max(minWidth, maxContentWidth + 4, header.length + 2)

  const innerWidth = width - 2
  const topBorder = `┌${header}${"─".repeat(innerWidth - header.length)}┐`
  const bottomBorder = `└${"─".repeat(innerWidth)}┘`
  const lines = contentLines.map(line => {
    const padded = line.padEnd(innerWidth - 2)
    return `│ ${padded} │`
  })
  return `${topBorder}\n${lines.join("\n")}\n${bottomBorder}`
}
