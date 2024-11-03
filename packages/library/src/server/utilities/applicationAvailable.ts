import commandExists from "command-exists"

export async function applicationAvailable(command: string): Promise<string | null> {
  return commandExists(command)
}
