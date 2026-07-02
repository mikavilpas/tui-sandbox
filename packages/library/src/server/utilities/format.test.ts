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
