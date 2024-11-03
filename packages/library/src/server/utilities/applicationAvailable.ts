import commandExists from "command-exists"

export async function applicationAvailable(command: string): Promise<boolean> {
  return commandExists(command)
}
