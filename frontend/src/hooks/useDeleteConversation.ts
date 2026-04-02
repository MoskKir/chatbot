import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { removeConversation } from "@/lib/cache"
import { CONVERSATIONS_KEY } from "./useConversationList"

export function useDeleteConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteConversation(id),
    onMutate: (id) => {
      removeConversation(qc, id)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: CONVERSATIONS_KEY })
    },
  })
}
