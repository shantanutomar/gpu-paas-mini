export interface UsageEvent {
  timestamp: string; // ISO timestamp
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  apiKeyId: string | null; // null if no valid key
  errorMessage?: string; // only for 4xx/5xx
}
