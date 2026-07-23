import type { FormatterConfig } from "../updateTestdirectorySchemaFile.js"
import { formatCode } from "../utilities/format.js"

const parse = (o: unknown, seen: object[]): string => {
  switch (typeof o) {
    case "string":
      return `z.literal("${o.replaceAll('"', `\\"`)}")`
    case "number":
      return "z.number()"
    case "bigint":
      return "z.number().int()"
    case "boolean":
      return "z.boolean()"
    case "object":
      if (o === null) {
        return "z.null()"
      }
      if (seen.find(_obj => Object.is(_obj, o))) {
        throw new Error("Circular objects are not supported")
      }
      seen.push(o)
      if (Array.isArray(o)) {
        const options = o
          .map(obj => parse(obj, seen))
          .reduce((acc: string[], curr: string) => {
            if (acc.includes(curr)) {
              return acc
            } else {
              acc.push(curr)
              return acc
            }
          }, [])
        if (options.length === 1) {
          return `z.array(${options[0]})`
        } else if (options.length > 1) {
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          return `z.array(z.union([${options}]))`
        } else {
          return `z.array(z.unknown())`
        }
      }
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      return `z.object({${Object.entries(o).map(([k, v]) => {
        const key = k.replaceAll("'", "\\'")
        return `'${key}':${parse(v, seen)}`
      })}})`
    case "undefined":
      return "z.undefined()"
    case "function":
      return "z.function()"
    case "symbol":
    default:
      return "z.unknown()"
  }
}
export async function jsonToZod(config: FormatterConfig, object: unknown, name: string = "schema"): Promise<string> {
  return formatCode(config, `import * as z from "zod"\n\nexport const ${name}=${parse(object, [])}`)
}
