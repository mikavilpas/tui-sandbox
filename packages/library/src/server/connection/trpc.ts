import { initTRPC } from "@trpc/server"

export const trpc = initTRPC.context<object>().create()
