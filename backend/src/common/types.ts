/** Nullable string — used for optional identifiers (userId, anonId, etc.) */
export type Nullable<T> = T | null;

/** Optional user/anonymous identity pair resolved from auth */
export interface Identity {
  userId: Nullable<string>;
  anonId: Nullable<string>;
}

export function truncateTitle(content: string, maxLen = 40): string {
  return content.slice(0, maxLen) + (content.length > maxLen ? '...' : '');
}
