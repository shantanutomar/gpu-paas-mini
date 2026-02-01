import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JobEntity } from './entities/job.entity';

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  async create(
    createJobDto: CreateJobDto,
    idempotencyKey?: string,
  ): Promise<JobEntity> {
    // Handle idempotency if key is provided
    if (idempotencyKey) {
      const existing = await this.prisma.job.findUnique({
        where: { idempotencyKey },
      });

      if (existing) {
        // Check if payload matches
        const existingInput = JSON.stringify(existing.inputJson);
        const newInput = JSON.stringify(createJobDto.inputJson);

        if (existingInput !== newInput) {
          throw new ConflictException(
            'Idempotency key already used with different payload',
          );
        }

        // Return existing job
        return this.mapToEntity(existing);
      }
    }

    // Create job in database with QUEUED status
    const job = await this.prisma.job.create({
      data: {
        deploymentId: createJobDto.deploymentId,
        inputJson: createJobDto.inputJson,
        status: 'QUEUED',
        timeoutMs: createJobDto.timeoutMs ?? 60000,
        maxAttempts: createJobDto.maxAttempts ?? 1,
        retryDelayMs: createJobDto.retryDelayMs ?? 1000,
        idempotencyKey,
      },
    });

    // Enqueue job in BullMQ
    await this.queueService.addJob(job.id);

    return this.mapToEntity(job);
  }

  async findOne(id: string): Promise<JobEntity> {
    const job = await this.prisma.job.findUnique({
      where: { id },
    });

    return this.mapToEntity(job);
  }

  async findAll(): Promise<JobEntity[]> {
    const jobs = await this.prisma.job.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      include: {
        deployment: {
          select: {
            id: true,
            modelName: true,
          },
        },
      },
    });

    return jobs.map((job) => this.mapToEntity(job));
  }

  async cancel(id: string): Promise<JobEntity> {
    const job = await this.prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException(`Job with id ${id} not found`);
    }

    // Check if job is already in a terminal state
    const terminalStates = ['SUCCEEDED', 'FAILED', 'CANCELLED', 'TIMED_OUT'];
    if (terminalStates.includes(job.status)) {
      throw new ConflictException(
        `Job is already in terminal state: ${job.status}`,
      );
    }

    // If job is queued, cancel it immediately
    if (job.status === 'QUEUED') {
      const cancelled = await this.prisma.job.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          finishedAt: new Date(),
          error: 'Job cancelled by user',
        },
      });

      // Try to remove from queue (best effort)
      try {
        await this.queueService.removeJob(id);
      } catch (err) {
        console.warn(`Failed to remove job ${id} from queue:`, err);
      }

      return this.mapToEntity(cancelled);
    }

    // If job is running, request cancellation
    if (job.status === 'RUNNING') {
      const updated = await this.prisma.job.update({
        where: { id },
        data: {
          status: 'CANCEL_REQUESTED',
          cancelledAt: new Date(),
        },
      });

      return this.mapToEntity(updated);
    }

    // For CANCEL_REQUESTED, just return current state
    return this.mapToEntity(job);
  }

  private mapToEntity(job: any): JobEntity {
    return {
      id: job.id,
      deploymentId: job.deploymentId,
      ...(job.deployment && {
        deployment: {
          id: job.deployment.id,
          modelName: job.deployment.modelName,
        },
      }),
      status: job.status,
      inputJson: job.inputJson as Record<string, any>,
      outputJson: job.outputJson as Record<string, any> | null,
      error: job.error,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      cancelledAt: job.cancelledAt,
      timeoutMs: job.timeoutMs,
      attempt: job.attempt,
      maxAttempts: job.maxAttempts,
      retryDelayMs: job.retryDelayMs,
      idempotencyKey: job.idempotencyKey,
    };
  }
}
