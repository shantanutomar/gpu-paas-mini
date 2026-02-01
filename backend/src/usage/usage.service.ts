import { Injectable } from '@nestjs/common';
import { UsageStorageService } from './usage-storage.service';
import { UsageEvent } from './usage-event.interface';
import { UsageSummaryEntity } from './entity/usage-summary.entity';

@Injectable()
export class UsageService {
  constructor(private usageStorage: UsageStorageService) {}

  getEvents(filter?: {
    range?: string;
    endpoint?: string;
    apiKeyId?: string;
    limit?: number;
  }): UsageEvent[] {
    return this.usageStorage.getEvents(filter);
  }

  getSummary(range?: string): UsageSummaryEntity {
    const events = this.usageStorage.getEvents({ range: range || '1h' });

    const total = events.length;
    const success = events.filter(
      (e) => e.statusCode >= 200 && e.statusCode < 400,
    ).length;
    const errors = events.filter((e) => e.statusCode >= 400).length;

    // Calculate average latency
    const avgLatencyMs =
      total > 0 ? events.reduce((sum, e) => sum + e.durationMs, 0) / total : 0;

    // Calculate P95 latency
    const p95LatencyMs = this.calculateP95(events.map((e) => e.durationMs));

    // Group by endpoint
    const byEndpoint = this.groupByEndpoint(events);

    // Group by API key
    const byApiKey = this.groupByApiKey(events);

    return {
      range: range || '1h',
      total,
      success,
      errors,
      avgLatencyMs: Math.round(avgLatencyMs * 100) / 100,
      p95LatencyMs: Math.round(p95LatencyMs * 100) / 100,
      byEndpoint,
      byApiKey,
    };
  }

  private calculateP95(latencies: number[]): number {
    if (latencies.length === 0) return 0;

    const sorted = [...latencies].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[Math.max(0, index)];
  }

  private groupByEndpoint(events: UsageEvent[]) {
    const grouped = new Map<
      string,
      { total: number; errors: number; totalLatency: number }
    >();

    for (const event of events) {
      const existing = grouped.get(event.path) || {
        total: 0,
        errors: 0,
        totalLatency: 0,
      };

      existing.total += 1;
      if (event.statusCode >= 400) {
        existing.errors += 1;
      }
      existing.totalLatency += event.durationMs;

      grouped.set(event.path, existing);
    }

    return Array.from(grouped.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        total: stats.total,
        errors: stats.errors,
        avgLatencyMs:
          Math.round((stats.totalLatency / stats.total) * 100) / 100,
      }))
      .sort((a, b) => b.total - a.total); // Sort by total descending
  }

  private groupByApiKey(events: UsageEvent[]) {
    const grouped = new Map<string, { total: number; errors: number }>();

    for (const event of events) {
      const keyId = event.apiKeyId || 'unknown';
      const existing = grouped.get(keyId) || {
        total: 0,
        errors: 0,
      };

      existing.total += 1;
      if (event.statusCode >= 400) {
        existing.errors += 1;
      }

      grouped.set(keyId, existing);
    }

    return Array.from(grouped.entries())
      .map(([apiKeyId, stats]) => ({
        apiKeyId,
        total: stats.total,
        errors: stats.errors,
      }))
      .sort((a, b) => b.total - a.total); // Sort by total descending
  }
}
