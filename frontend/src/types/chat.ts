export interface MessageImage {
  src: string
  name: string
}

export interface MessageFile {
  id: string
  filename: string
  mimeType: string
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  images?: MessageImage[]
  files?: MessageFile[]
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
}
