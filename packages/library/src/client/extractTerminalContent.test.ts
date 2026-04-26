import { describe, expect, it } from "vitest"
import { extractTerminalContent } from "./extractTerminalContent.js"

describe("extractTerminalContent", () => {
  it("works with basic cases", () => {
    expect(extractTerminalContent([]), "returns undefined for an empty rows array").toBeUndefined()
    expect(extractTerminalContent(["", "  ", "\t"]), "returns undefined when every row is blank").toBeUndefined()
    expect(extractTerminalContent(["a", "b", "c"]), "returns undefined when every row is blank").toBe("a\nb\nc")
    expect(extractTerminalContent(["hello", "world", "", "  "]), "returns undefined when every row is blank").toBe(
      "hello\nworld"
    )
    expect(extractTerminalContent(["", "hello"]), "returns undefined when every row is blank").toBe("\nhello")
  })

  describe("multi-byte / Unicode", () => {
    it("preserves CJK wide characters", () => {
      expect(extractTerminalContent(["你好世界"])).toBe("你好世界")
    })

    it("preserves emoji surrogate pairs", () => {
      expect(extractTerminalContent(["🎉 Done!"])).toBe("🎉 Done!")
    })

    it("preserves precomposed and decomposed diacritics", () => {
      expect(extractTerminalContent(["café"])).toBe("café")
      expect(extractTerminalContent(["café"])).toBe("café")
    })

    it("treats ideographic space as blank when trimming trailing rows", () => {
      // String.prototype.trim() removes U+3000 per spec, so a row containing
      // only ideographic spaces is dropped from the trailing tail.
      expect(extractTerminalContent(["text", "　"])).toBe("text")
    })
  })
})
