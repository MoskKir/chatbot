import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toMessage } from "@/lib/cache"
import type { Message, MessageImage, MessageFile } from "@/types"

export const conversationKey = (id: string) => ["conversation", id] as const

export function useConversationMessages(id: string | null) {
  return useQuery({
    queryKey: conversationKey(id!),
    queryFn: async (): Promise<Message[]> => {
      const data = await api.getConversation(id!)

      return data.messages.map((m) => {
        const docs = m.documents ?? []

        const images: MessageImage[] = docs
          .filter((d) => d.isImage && d.url)
          .map((d) => ({ src: d.url!, name: d.filename }))

        const files: MessageFile[] = docs
          .filter((d) => !d.isImage)
          .map((d) => ({ id: d.id, filename: d.filename, mimeType: d.mimeType }))

        return {
          ...toMessage(m),
          ...(images.length > 0 ? { images } : {}),
          ...(files.length > 0 ? { files } : {}),
        }
      })
    },
    enabled: !!id && !id.startsWith("__"),
  })
}
