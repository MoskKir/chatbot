export interface ConversationListItem {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: { id: string; role: string; content: string; createdAt: string }[]
}

export interface ConversationDetailMessage {
  id: string
  role: string
  content: string
  createdAt: string
  documents?: { id: string; filename: string; storagePath: string; url: string | null; isImage: boolean; mimeType: string }[]
}

export interface ConversationDetail {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: ConversationDetailMessage[]
}

export interface UsageInfo {
  authenticated: boolean
  remaining: number | null
  limit: number | null
  resetsAt: string | null
}

export interface DocumentInfo {
  id: string
  filename: string
  mimeType: string
  size: number
  isImage: boolean
  url: string | null
  createdAt: string
}
