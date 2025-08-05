/// <reference types="cypress" />

/** Problem: cypress provides the `contains` method, but it only checks the
 * first match on the page.
 *
 * Solution: we need to check all elements on the page and filter them
 * by the text we are looking for. Then we can check if the background
 * color of the element is the same as the one we are looking for.
 *
 * Limitation: text spanning multiple lines will not be detected.
 */
export function textIsVisibleWithColor(text: string, color: string): Cypress.Chainable<JQuery> {
  return cy
    .get("div.xterm-rows span")
    .filter(`:contains(${text})`)
    .should("exist") // ensures there's at least one match
    .should($els => {
      const colors = $els.map((_, el) => window.getComputedStyle(el).color).toArray()
      expect(colors).to.include(color)
    })
}

/** Like `textIsVisibleWithColor`, but checks the background color instead
 * of the text color.
 */
export function textIsVisibleWithBackgroundColor(text: string, color: string): Cypress.Chainable<JQuery> {
  return cy
    .get("div.xterm-rows span")
    .filter(`:contains(${text})`)
    .should("exist") // ensures there's at least one match
    .should($els => {
      const colors = $els.map((_, el) => window.getComputedStyle(el).backgroundColor).toArray()
      expect(colors).to.include(color)
    })
}
