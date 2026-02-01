/**
 * Custom SSE (Server-Sent Events) client using fetch API
 * Supports custom headers (x-api-key) which native EventSource doesn't
 */

export interface SSEEvent {
  type: string;
  data: any;
}

export class SSEClient {
  private abortController: AbortController | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  constructor(
    private url: string,
    private headers: Record<string, string> = {},
    private onEvent: (event: SSEEvent) => void,
    private onError?: (error: Error) => void
  ) {}

  async connect(): Promise<void> {
    this.abortController = new AbortController();

    try {
      const response = await fetch(this.url, {
        headers: {
          ...this.headers,
          Accept: 'text/event-stream',
        },
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      this.reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await this.reader.read();

        if (done) {
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete messages (split by double newline)
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // Keep incomplete message in buffer

        for (const message of messages) {
          if (!message.trim()) continue;

          const event = this.parseSSEMessage(message);
          if (event) {
            this.onEvent(event);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        this.onError?.(error);
      }
    }
  }

  private parseSSEMessage(message: string): SSEEvent | null {
    let eventType = 'message';
    let data = '';

    const lines = message.split('\n');
    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        data = line.slice(5).trim();
      } else if (line.startsWith(':')) {
        // Comment, ignore
        continue;
      }
    }

    if (!data) return null;

    try {
      // Try to parse as JSON
      const parsedData = JSON.parse(data);
      return { type: eventType, data: parsedData };
    } catch {
      // Return as raw string if not JSON
      return { type: eventType, data };
    }
  }

  disconnect(): void {
    this.abortController?.abort();
    this.reader?.cancel();
    this.abortController = null;
    this.reader = null;
  }

  isConnected(): boolean {
    return this.abortController !== null;
  }
}
