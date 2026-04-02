import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export const CONVERSATIONS_KEY = ["conversations"] as const

export function useConversationList() {
  return useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: async () => {
      const data = await api.getConversations()
      return data.map((c) => ({
        id: c.id,
        title: c.title,
        createdAt: new Date(c.createdAt),
        messages: [],
      }))
    },
  })
}
