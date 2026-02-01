import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsageEvent } from './usage-event.interface';

@Injectable()
export class UsageStorageService {
  private events: UsageEvent[] = [];
  private readonly maxEvents: number;

  constructor(private configService: ConfigService) {
    this.maxEvents =
      this.configService.get<number>('USAGE_BUFFER_SIZE') || 1000;
  }

  addEvent(event: UsageEvent): void {
    this.events.push(event);
    // Keep only the last N events (ring buffer)
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }

  getEvents(filter?: {
    range?: string;
    endpoint?: string;
    apiKeyId?: string;
    limit?: number;
  }): UsageEvent[] {
    let filtered = [...this.events];

    // Filter by time range
    if (filter?.range) {
      const cutoffTime = this.getRangeCutoff(filter.range);
      filtered = filtered.filter((e) => new Date(e.timestamp) >= cutoffTime);
    }

    // Filter by endpoint
    if (filter?.endpoint) {
      filtered = filtered.filter((e) => e.path === filter.endpoint);
    }

    // Filter by API key
    if (filter?.apiKeyId) {
      filtered = filtered.filter((e) => e.apiKeyId === filter.apiKeyId);
    }

    // Sort by newest first
    filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // Apply limit
    const limit = Math.min(filter?.limit || 200, 1000);
    return filtered.slice(0, limit);
  }

  getAllEvents(): UsageEvent[] {
    return [...this.events];
  }

  private getRangeCutoff(range: string): Date {
    const now = new Date();
    switch (range) {
      case '15m':
        return new Date(now.getTime() - 15 * 60 * 1000);
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 60 * 60 * 1000); // default 1h
    }
  }
}
