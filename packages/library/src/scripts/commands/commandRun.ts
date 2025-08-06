import concurrently from "concurrently"
import { debuglog } from "util"

const log = debuglog("tui-sandbox.commandRun")

export async function commandRun(): Promise<void> {
  const job = concurrently(
    [
      {
        name: "server",
        command: "tui start",
        prefixColor: "blue",
      },
      {
        name: "cypress",
        command: `'wait-on --timeout 60000 http-get://127.0.0.1:3000/ping && pnpm exec cypress run --config baseUrl=http://127.0.0.1:3000 --quiet'`,
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
}
