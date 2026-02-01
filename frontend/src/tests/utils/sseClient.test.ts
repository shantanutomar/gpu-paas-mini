import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SSEClient } from '../../utils/sseClient';

describe('SSEClient', () => {
  let mockAbort: ReturnType<typeof vi.fn>;
  let mockRead: ReturnType<typeof vi.fn>;
  let mockCancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockAbort = vi.fn();
    mockRead = vi.fn();
    mockCancel = vi.fn();

    // Mock AbortController
    global.AbortController = vi.fn().mockImplementation(() => ({
      signal: {},
      abort: mockAbort,
    })) as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct properties', () => {
    const onEvent = vi.fn();
    const onError = vi.fn();

    const client = new SSEClient(
      'http://localhost:3001/api/events',
      { 'x-api-key': 'test-key' },
      onEvent,
      onError
    );

    expect(client).toBeDefined();
    expect(client.isConnected()).toBe(false);
  });

  it('should call disconnect on disconnect()', () => {
    const onEvent = vi.fn();
    const client = new SSEClient('http://localhost:3001/api/events', {}, onEvent);

    client.disconnect();

    expect(client.isConnected()).toBe(false);
  });

  it('should parse SSE messages correctly', async () => {
    const onEvent = vi.fn();
    const testData = { type: 'status', data: { status: 'RUNNING' } };

    // Mock fetch response
    const mockResponse = {
      ok: true,
      body: {
        getReader: () => ({
          read: vi
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(
                `event: status\ndata: ${JSON.stringify(testData.data)}\n\n`
              ),
            })
            .mockResolvedValueOnce({
              done: true,
              value: undefined,
            }),
          cancel: mockCancel,
        }),
      },
    };

    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const client = new SSEClient('http://localhost:3001/api/events', {}, onEvent);

    await client.connect();

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/events', {
      headers: {
        Accept: 'text/event-stream',
      },
      signal: expect.any(Object),
    });
  });
});
