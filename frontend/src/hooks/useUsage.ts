import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export const USAGE_KEY = ["usage"] as const

export function useUsage() {
  return useQuery({
    queryKey: USAGE_KEY,
    queryFn: () => api.getUsage(),
    staleTime: 10_000,
  })
}
