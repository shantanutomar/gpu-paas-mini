import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { Subject } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

export interface JobStatusEvent {
  jobId: string;
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  ts: string;
  outputJson?: Record<string, any>;
  error?: string;
}

@Injectable()
export class JobsEventsService implements OnModuleInit, OnModuleDestroy {
  private queueEvents: QueueEvents;
  private connection: Redis;
  private eventSubjects = new Map<string, Subject<JobStatusEvent>>();

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    const redisUrl =
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

    // Create Redis connection for QueueEvents
    this.connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });

    // Create QueueEvents listener
    this.queueEvents = new QueueEvents('gpu-jobs', {
      connection: this.connection,
    });

    // Listen to BullMQ events
    this.queueEvents.on('waiting', async ({ jobId }) => {
      await this.handleEvent(jobId, 'QUEUED');
    });

    this.queueEvents.on('active', async ({ jobId }) => {
      await this.handleEvent(jobId, 'RUNNING');
    });

    this.queueEvents.on('completed', async ({ jobId }) => {
      await this.handleEvent(jobId, 'SUCCEEDED', true);
    });

    this.queueEvents.on('failed', async ({ jobId }) => {
      await this.handleEvent(jobId, 'FAILED', true);
    });

    console.log('[JobsEventsService] Listening to BullMQ events');
  }

  async onModuleDestroy() {
    // Close all subjects
    this.eventSubjects.forEach((subject) => subject.complete());
    this.eventSubjects.clear();

    await this.queueEvents.close();
    await this.connection.quit();
  }

  private async handleEvent(
    bullJobId: string,
    status: JobStatusEvent['status'],
    fetchDetails = false,
  ) {
    // BullMQ job ID is now the same as our database job ID
    const jobId = bullJobId;

    let outputJson: Record<string, any> | undefined;
    let error: string | undefined;

    // Fetch details from DB if needed
    if (fetchDetails) {
      try {
        const job = await this.prisma.job.findUnique({
          where: { id: jobId },
        });

        if (job) {
          outputJson =
            (job.outputJson as Record<string, any> | null) ?? undefined;
          error = job.error ?? undefined;
        }
      } catch (err) {
        console.error(
          `[JobsEventsService] Failed to fetch job details for ${jobId}:`,
          err,
        );
      }
    }

    const event: JobStatusEvent = {
      jobId,
      status,
      ts: new Date().toISOString(),
      ...(outputJson && { outputJson }),
      ...(error && { error }),
    };

    // Emit to subscribers
    const subject = this.eventSubjects.get(jobId);
    if (subject) {
      subject.next(event);
    }
  }

  getJobEvents(jobId: string): Subject<JobStatusEvent> {
    if (!this.eventSubjects.has(jobId)) {
      this.eventSubjects.set(jobId, new Subject<JobStatusEvent>());
    }
    return this.eventSubjects.get(jobId)!;
  }

  removeJobSubscription(jobId: string) {
    const subject = this.eventSubjects.get(jobId);
    if (subject) {
      subject.complete();
      this.eventSubjects.delete(jobId);
    }
  }

  async getCurrentJobState(jobId: string): Promise<JobStatusEvent | null> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return null;
    }

    return {
      jobId: job.id,
      status: job.status as JobStatusEvent['status'],
      ts: new Date().toISOString(),
      ...(job.outputJson && {
        outputJson: job.outputJson as Record<string, any>,
      }),
      ...(job.error && { error: job.error }),
    };
  }
}
