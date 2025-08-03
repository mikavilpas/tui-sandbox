import { flavors } from "@catppuccin/palette"

import { textIsVisibleWithBackgroundColor, textIsVisibleWithColor } from "@tui-sandbox/library/src/client"
import { rgbify } from "../../../library/src/client/color-utilities"

describe("custom assertions bundled with tui-sandbox", () => {
  it("can use textIsVisibleWithColor", () => {
    cy.visit("/")
    cy.startTerminalApplication({
      commandToRun: ["bash"],
    }).then(_ => {
      // wait until text on the start screen is visible
      cy.contains("myprompt")

      // create some text in various colors
      cy.typeIntoTerminal('echo -e "\\033[31mred text\\033[0m"{enter}')
      cy.typeIntoTerminal('echo -e "\\033[32mgreen text\\033[0m"{enter}')
      cy.typeIntoTerminal('echo -e "\\033[34mblue text\\033[0m"{enter}')
      cy.typeIntoTerminal('echo -e "\\033[33myellow text\\033[0m"{enter}')
      cy.typeIntoTerminal('echo -e "\\033[35mpurple text\\033[0m"{enter}')

      textIsVisibleWithColor("red text", rgbify(flavors.macchiato.colors.red.rgb))
      textIsVisibleWithColor("green text", rgbify(flavors.macchiato.colors.green.rgb))
      textIsVisibleWithColor("blue text", rgbify(flavors.macchiato.colors.blue.rgb))
      textIsVisibleWithColor("yellow text", rgbify(flavors.macchiato.colors.yellow.rgb))
      textIsVisibleWithColor("purple text", rgbify(flavors.macchiato.colors.lavender.rgb))

      // the assertion can match a non-unique string
      textIsVisibleWithColor("text", rgbify(flavors.macchiato.colors.red.rgb))
      textIsVisibleWithColor("text", rgbify(flavors.macchiato.colors.green.rgb))
      textIsVisibleWithColor("text", rgbify(flavors.macchiato.colors.blue.rgb))
      textIsVisibleWithColor("text", rgbify(flavors.macchiato.colors.yellow.rgb))
      textIsVisibleWithColor("text", rgbify(flavors.macchiato.colors.lavender.rgb))
    })
  })

  it("can use textIsVisibleWithBackgroundColor", () => {
    cy.visit("/")
    cy.startTerminalApplication({
      commandToRun: ["bash"],
    }).then(_ => {
      // wait until text on the start screen is visible
      cy.contains("myprompt")

      // create some text in black foreground and various background colors
      cy.typeIntoTerminal('echo -e "\\033[30;41mtext on red\\033[0m"{enter}')
      cy.typeIntoTerminal('echo -e "\\033[30;42mtext on green\\033[0m"{enter}')
      cy.typeIntoTerminal('echo -e "\\033[30;44mtext on blue\\033[0m"{enter}')
      cy.typeIntoTerminal('echo -e "\\033[30;43mtext on yellow\\033[0m"{enter}')
      cy.typeIntoTerminal('echo -e "\\033[30;45mtext on purple\\033[0m"{enter}')

      textIsVisibleWithBackgroundColor("text on red", rgbify(flavors.macchiato.colors.red.rgb))
      textIsVisibleWithBackgroundColor("text on green", rgbify(flavors.macchiato.colors.green.rgb))
      textIsVisibleWithBackgroundColor("text on blue", rgbify(flavors.macchiato.colors.blue.rgb))
      textIsVisibleWithBackgroundColor("text on yellow", rgbify(flavors.macchiato.colors.yellow.rgb))
      textIsVisibleWithBackgroundColor("text on purple", rgbify(flavors.macchiato.colors.lavender.rgb))

      // the assertion can match a non-unique string
      textIsVisibleWithBackgroundColor("text", rgbify(flavors.macchiato.colors.red.rgb))
      textIsVisibleWithBackgroundColor("text", rgbify(flavors.macchiato.colors.green.rgb))
      textIsVisibleWithBackgroundColor("text", rgbify(flavors.macchiato.colors.blue.rgb))
      textIsVisibleWithBackgroundColor("text", rgbify(flavors.macchiato.colors.yellow.rgb))
      textIsVisibleWithBackgroundColor("text", rgbify(flavors.macchiato.colors.lavender.rgb))
    })
  })
})
