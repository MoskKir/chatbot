import { request } from "../http"
import type {
  ConversationListItem,
  ConversationDetail,
  UsageInfo,
  DocumentInfo,
} from "@/types"

export const chatApi = {
  getConversations: () =>
    request<ConversationListItem[]>("/chat/conversations"),

  getConversation: (id: string) =>
    request<ConversationDetail>(`/chat/conversations/${id}`),

  createConversation: (title: string) =>
    request<{ id: string; title: string }>("/chat/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }),

  deleteConversation: (id: string) =>
    request<{ deleted: boolean }>(`/chat/conversations/${id}`, {
      method: "DELETE",
    }),

  getUsage: () => request<UsageInfo>("/chat/usage"),

  uploadDocument: (conversationId: string, file: File) => {
    const form = new FormData()
    form.append("file", file)
    return request<DocumentInfo>(
      `/chat/conversations/${conversationId}/documents`,
      { method: "POST", body: form },
    )
  },

  getDocuments: (conversationId: string) =>
    request<DocumentInfo[]>(
      `/chat/conversations/${conversationId}/documents`,
    ),

  deleteDocument: (docId: string) =>
    request<{ deleted: boolean }>(`/chat/documents/${docId}`, {
      method: "DELETE",
    }),

  getModelSettings: () =>
    request<{ model: string; allowed: string[] }>("/chat/settings/model"),
}
