import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateTitle(content: string, maxLen = 40): string {
  return content.slice(0, maxLen) + (content.length > maxLen ? "..." : "")
}

export function modelDisplayName(modelId: string): string {
  return modelId.split("/")[1] ?? modelId
}

