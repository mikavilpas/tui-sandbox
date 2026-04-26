import { visualWidth } from "./visualWidth.js"

/** Draw a Unicode box around text content with a title in the top border. */
export const drawTextBox = (title: string, content: string, minWidth = 88): string => {
  const header = ` ${title} `
  const headerWidth = visualWidth(header)
  const contentLines = content.split("\n")

  const maxContentWidth = Math.max(...contentLines.map(line => visualWidth(line)))
  const width = Math.max(minWidth, maxContentWidth + 4, headerWidth + 2)

  const innerWidth = width - 2
  const topBorder = `┌${header}${"─".repeat(innerWidth - headerWidth)}┐`
  const bottomBorder = `└${"─".repeat(innerWidth)}┘`
  const lines = contentLines.map(line => {
    const padding = " ".repeat(innerWidth - 2 - visualWidth(line))
    return `│ ${line}${padding} │`
  })
  return `${topBorder}\n${lines.join("\n")}\n${bottomBorder}`
}
