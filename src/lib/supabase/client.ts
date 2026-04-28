import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

let browserClient: ReturnType<typeof createClientComponentClient> | null = null

export const createClient = () => {
  if (!browserClient) {
    browserClient = createClientComponentClient()
  }

  return browserClient
}
