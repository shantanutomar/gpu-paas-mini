import { Worker, Job as BullJob } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis connection for worker
const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

// Create worker
const worker = new Worker(
  'gpu-jobs',
  async (job: BullJob) => {
    const { jobId } = job.data;
    console.log(`[Worker] Processing job ${jobId}`);

    try {
      // 1. Update job to RUNNING status
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'RUNNING',
          startedAt: new Date(),
        },
      });
      console.log(`[Worker] Job ${jobId} status: RUNNING`);

      // 2. Simulate GPU compute (2-5 seconds random)
      const computeTime = Math.floor(Math.random() * 3000) + 2000; // 2000-5000ms
      await new Promise((resolve) => setTimeout(resolve, computeTime));

      // 3. Generate simulated output
      const tokensUsed = Math.floor(Math.random() * 150) + 50; // 50-200 tokens
      const outputJson = {
        message: 'simulated response',
        jobId: jobId,
        tokensUsed: tokensUsed,
      };

      // 4. Update job to SUCCEEDED status
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'SUCCEEDED',
          outputJson: outputJson,
          finishedAt: new Date(),
        },
      });
      console.log(`[Worker] Job ${jobId} status: SUCCEEDED (${tokensUsed} tokens, ${computeTime}ms)`);
    } catch (error) {
      // Handle errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Worker] Job ${jobId} status: FAILED - ${errorMessage}`);

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          error: errorMessage,
          finishedAt: new Date(),
        },
      });
    }
  },
  {
    connection,
    concurrency: 5, // Process up to 5 jobs concurrently
  },
);

// Worker event handlers
worker.on('completed', (job) => {
  console.log(`[Worker] ✓ Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] ✗ Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('[Worker] Worker error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[Worker] Shutting down gracefully...');
  await worker.close();
  await connection.quit();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[Worker] Shutting down gracefully...');
  await worker.close();
  await connection.quit();
  await prisma.$disconnect();
  process.exit(0);
});

console.log('[Worker] GPU jobs worker started. Listening on queue: gpu-jobs');
console.log('[Worker] Redis URL:', redisUrl);
console.log('[Worker] Press Ctrl+C to exit');
