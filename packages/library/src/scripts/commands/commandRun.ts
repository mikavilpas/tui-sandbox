import assert from "assert"
import type { CloseEvent } from "concurrently"
import concurrently from "concurrently"
import type { PartialDeep } from "type-fest"
import { debuglog } from "util"
import * as z from "zod"
import type { AllKeys } from "../../server/types.js"

const log = debuglog("tui-sandbox.commandRun")

export type TestResultExitCode = string | number

const cypressName = "cypress"
export async function commandRun(): Promise<TestResultExitCode> {
  const job = concurrently(
    [
      {
        name: "server",
        command: "tui start",
        prefixColor: "blue",
      },
      {
        name: cypressName,
        command: `'wait-on --timeout 60000 http-get://127.0.0.1:3000/ping && cypress run --config baseUrl=http://127.0.0.1:3000 --quiet'`,
        prefixColor: "yellow",
      },
    ],
    {
      killOthersOn: ["failure", "success"],
      padPrefix: true, // makes all the prefixes the same length
      successCondition: "command-cypress", // the test run that determines success/failure
    }
  )

  await job.result.then(
    _ => {
      log("All commands completed successfully")
    },
    (err: unknown) => {
      log("One or more commands failed. Debug info follows.", err)
    }
  )

  try {
    const result = await job.result
    const cypressCommand = result.find(cmd => cmd.command.name === "cypress")
    assert(cypressCommand, "Cypress command not found in the result")
    return cypressCommand.exitCode
  } catch (e) {
    // an array of [`CloseEvent`](#CloseEvent), in the order that the commands terminated.
    // https://github.com/open-cli-tools/concurrently/blob/37212b7d925d8ece22d3afa68a77eef36bb833cc/README.md?plain=1#L125
    const infos = z
      .array(
        z.object({
          command: z.object({
            name: z.string(),
          } satisfies PartialDeep<AllKeys<CloseEvent["command"]>>),
          exitCode: z.number().or(z.string()),
        } satisfies PartialDeep<AllKeys<CloseEvent>>)
      )
      .parse(e)

    const cypressCommand = infos.find(cmd => cmd.command.name === cypressName)
    assert(cypressCommand, "Cypress command not found in the result")

    return cypressCommand.exitCode
  }
}
