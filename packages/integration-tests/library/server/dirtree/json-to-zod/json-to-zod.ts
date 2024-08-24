import { format, resolveConfig } from "prettier"
import babelParser from "prettier/parser-babel"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)

export async function jsonToZod(object: unknown, name: string = "schema"): Promise<string> {
  const parse = (o: unknown, seen: object[]): string => {
    switch (typeof o) {
      case "string":
        return `z.literal("${o}")`
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
            .reduce((acc: string[], curr: string) => (acc.includes(curr) ? acc : [...acc, curr]), [])
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
        return `z.object({${Object.entries(o).map(([k, v]) => `'${k}':${parse(v, seen)}`)}})`
      case "undefined":
        return "z.undefined()"
      case "function":
        return "z.function()"
      case "symbol":
      default:
        return "z.unknown()"
    }
  }

  const prettierConfig = await resolveConfig(__filename)

  return format(`import {z} from "zod"\n\nexport const ${name}=${parse(object, [])}`, {
    ...(prettierConfig || {}),
    parser: "babel",
    plugins: [babelParser],
  })
}
