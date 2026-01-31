import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private queue: Queue;
  private connection: Redis;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl =
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

    // Create Redis connection
    this.connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });

    // Create BullMQ queue
    this.queue = new Queue('gpu-jobs', {
      connection: this.connection,
    });
  }

  async onModuleDestroy() {
    await this.queue.close();
    await this.connection.quit();
  }

  getQueue(): Queue {
    return this.queue;
  }

  async addJob(jobId: string) {
    // Use our database job ID as the BullMQ job ID
    await this.queue.add('process-job', { jobId }, { jobId });
  }
}
