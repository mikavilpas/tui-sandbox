import { describe, expect, it } from "vitest"

import { formatCode } from "./format.js"

// The generated schema file contains TypeScript type syntax (type aliases,
// generics). The formatter must be able to parse and format it.
const unformattedTypeScript = `export type Foo=z.infer<typeof Bar>;const x={a:1,b:2}`

describe("prettier", () => {
  it("formats TypeScript, including type syntax", async () => {
    const result = await formatCode({ use: "prettier" }, unformattedTypeScript)
    expect(result).toMatchInlineSnapshot(`
      "export type Foo = z.infer<typeof Bar>;
      const x = { a: 1, b: 2 };
      "
    `)
  })
})

describe("oxfmt", () => {
  it("formats TypeScript, including type syntax", async () => {
    // the oxfmt cli should walk up the directory tree and discover the
    // tui-sandbox oxfmt config file, inheriting its code style. This should be
    // visible in the formatting result.
    const result = await formatCode({ use: "oxfmt" }, unformattedTypeScript)
    expect(result).toMatchInlineSnapshot(`
      "export type Foo = z.infer<typeof Bar>
      const x = { a: 1, b: 2 }
      "
    `)
  })

  it("throws when the code cannot be parsed", async () => {
    await expect(formatCode({ use: "oxfmt" }, "const x = {{{ invalid")).rejects.toThrow(
      /Error formatting code with oxfmt/
    )
  })
})
