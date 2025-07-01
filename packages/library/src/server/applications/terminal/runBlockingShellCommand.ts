import { exec } from "child_process"
import { join } from "path"
import util, { debuglog } from "util"
import type { BlockingCommandInput } from "../../blockingCommandInputSchema.js"
import type { BlockingShellCommandOutput, TestDirectory } from "../../types.js"

const log = debuglog("tui-sandbox.terminal.runBlockingShellCommand")

export async function executeBlockingShellCommand(
  testDirectory: TestDirectory,
  input: BlockingCommandInput,
  signal: AbortSignal | undefined,
  allowFailure: boolean,
  env: NodeJS.ProcessEnv
): Promise<BlockingShellCommandOutput> {
  const execPromise = util.promisify(exec)

  const cwd = getCwd({
    rootPathAbsolute: testDirectory.rootPathAbsolute,
    cwdRelative: input.cwdRelative,
    cwdAbsolute: input.cwd,
    home: testDirectory.rootPathAbsolute,
  })

  try {
    const result = await execPromise(input.command, {
      signal: signal,
      shell: input.shell,
      uid: input.uid,
      gid: input.gid,
      cwd,
      env,
    })
    log(
      `Successfully ran shell blockingCommand (${input.command}) in cwd: '${cwd}' with stdout: ${result.stdout}, stderr: ${result.stderr}`
    )
    return {
      type: "success",
      stdout: result.stdout,
      stderr: result.stderr,
    } satisfies BlockingShellCommandOutput
  } catch (e) {
    console.warn(`Error running shell blockingCommand (${input.command})`, e)
    if (allowFailure) {
      return {
        type: "failed",
      }
    }
    throw new Error(`Error running shell blockingCommand (${input.command})`, { cause: e })
  }
}

export type GetCwdArguments = {
  rootPathAbsolute: string
  cwdRelative: string | undefined
  cwdAbsolute: string | undefined
  home: string
}
export function getCwd(args: GetCwdArguments): string {
  if (args.cwdRelative) {
    return join(args.rootPathAbsolute, args.cwdRelative)
  }
  return args.cwdAbsolute ?? args.home
}
