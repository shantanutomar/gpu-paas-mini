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

// Helper: Check if error is retryable
function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  // Simulate retryable errors (network, provider 5xx, etc.)
  return (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('5xx') ||
    message.includes('unavailable')
  );
}

// Helper: Calculate exponential backoff with jitter
function calculateBackoff(attempt: number, baseDelay: number): number {
  const exponential = baseDelay * Math.pow(2, attempt - 1);
  const jitter = Math.random() * exponential * 0.1; // 10% jitter
  return exponential + jitter;
}

// Create worker
const worker = new Worker(
  'gpu-jobs',
  async (job: BullJob) => {
    const { jobId } = job.data;
    console.log(`[Worker] Processing job ${jobId}`);

    let dbJob = await prisma.job.findUnique({ where: { id: jobId } });
    if (!dbJob) {
      console.error(`[Worker] Job ${jobId} not found in database`);
      return;
    }

    // Check if job was already cancelled
    if (dbJob.status === 'CANCELLED') {
      console.log(`[Worker] Job ${jobId} was already cancelled, skipping`);
      return;
    }

    try {
      // 1. Update job to RUNNING status
      dbJob = await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'RUNNING',
          startedAt: new Date(),
        },
      });
      console.log(
        `[Worker] Job ${jobId} status: RUNNING (attempt ${dbJob.attempt}/${dbJob.maxAttempts})`,
      );

      // 2. Execute job with timeout and cancellation checks
      const startTime = Date.now();
      const timeoutMs = dbJob.timeoutMs;
      const checkInterval = 500; // Check for cancellation every 500ms

      // Simulate GPU compute (2-5 seconds random)
      const computeTime = Math.floor(Math.random() * 3000) + 2000;
      const iterations = Math.ceil(computeTime / checkInterval);

      for (let i = 0; i < iterations; i++) {
        // Check for timeout
        if (Date.now() - startTime > timeoutMs) {
          throw new Error('Job execution timed out');
        }

        // Check for cancellation request
        const currentJob = await prisma.job.findUnique({
          where: { id: jobId },
        });
        if (currentJob?.status === 'CANCEL_REQUESTED') {
          await prisma.job.update({
            where: { id: jobId },
            data: {
              status: 'CANCELLED',
              finishedAt: new Date(),
              error: 'Job cancelled by user during execution',
            },
          });
          console.log(`[Worker] Job ${jobId} status: CANCELLED (during execution)`);
          return;
        }

        // Simulate work
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(checkInterval, computeTime - i * checkInterval)),
        );
      }

      // 3. Generate simulated output
      const tokensUsed = Math.floor(Math.random() * 150) + 50;
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
      console.log(
        `[Worker] Job ${jobId} status: SUCCEEDED (${tokensUsed} tokens, ${computeTime}ms)`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Worker] Job ${jobId} error: ${errorMessage}`);

      // Check if error is timeout
      if (errorMessage.includes('timed out')) {
        await prisma.job.update({
          where: { id: jobId },
          data: {
            status: 'TIMED_OUT',
            error: `Job execution exceeded timeout of ${dbJob.timeoutMs}ms`,
            finishedAt: new Date(),
          },
        });
        console.log(`[Worker] Job ${jobId} status: TIMED_OUT`);
        return;
      }

      // Check if job should be retried
      const shouldRetry =
        isRetryableError(error as Error) && dbJob.attempt < dbJob.maxAttempts;

      if (shouldRetry) {
        const nextAttempt = dbJob.attempt + 1;
        const retryDelay = calculateBackoff(
          nextAttempt,
          dbJob.retryDelayMs || 1000,
        );

        console.log(
          `[Worker] Job ${jobId} will retry (attempt ${nextAttempt}/${dbJob.maxAttempts}) after ${Math.round(retryDelay)}ms`,
        );

        // Update job for retry
        await prisma.job.update({
          where: { id: jobId },
          data: {
            status: 'QUEUED',
            attempt: nextAttempt,
            error: `Attempt ${dbJob.attempt} failed: ${errorMessage}. Retrying...`,
            startedAt: null, // Reset for next attempt
          },
        });

        // Re-enqueue with delay
        await job.retry({ delay: retryDelay });
      } else {
        // Final failure
        await prisma.job.update({
          where: { id: jobId },
          data: {
            status: 'FAILED',
            error: `Failed after ${dbJob.attempt} attempt(s): ${errorMessage}`,
            finishedAt: new Date(),
          },
        });
        console.log(`[Worker] Job ${jobId} status: FAILED (no more retries)`);
      }
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
