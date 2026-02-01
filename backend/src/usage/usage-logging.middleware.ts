import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UsageStorageService } from './usage-storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { createHash } from 'crypto';

@Injectable()
export class UsageLoggingMiddleware implements NestMiddleware {
  constructor(
    private usageStorage: UsageStorageService,
    private prisma: PrismaService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // Skip logging for /health endpoint to reduce noise
    // Also skip usage endpoints to avoid recursive logging
    if (req.path === '/health' || req.path.startsWith('/api/usage')) {
      return next();
    }

    // Capture response to log after it's finished
    const originalSend = res.send;
    const self = this;

    res.send = function (body: any) {
      const durationMs = Date.now() - startTime;

      // Log the event asynchronously (don't block response)
      self
        .logEvent(req, res, durationMs)
        .catch((err) => console.error('Failed to log usage event:', err));

      // Call original send
      return originalSend.call(this, body);
    };

    next();
  }

  private async logEvent(
    req: Request,
    res: Response,
    durationMs: number,
  ): Promise<void> {
    // Resolve API key ID if present
    let apiKeyId: string | null = null;
    const apiKey = req.headers['x-api-key'] as string | undefined;

    if (apiKey) {
      try {
        const keyHash = createHash('sha256').update(apiKey).digest('hex');
        const apiKeyEntity = await this.prisma.apiKey.findUnique({
          where: { keyHash },
        });
        if (apiKeyEntity && !apiKeyEntity.revokedAt) {
          apiKeyId = apiKeyEntity.id;
        }
      } catch (err) {
        // Silently fail - API key resolution is best-effort
      }
    }

    // Capture error message for 4xx/5xx
    let errorMessage: string | undefined;
    if (res.statusCode >= 400) {
      errorMessage = res.statusMessage || `HTTP ${res.statusCode}`;
    }

    this.usageStorage.addEvent({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs,
      apiKeyId,
      errorMessage,
    });
  }
}
