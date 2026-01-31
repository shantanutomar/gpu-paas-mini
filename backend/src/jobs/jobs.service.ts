import { Injectable } from '@nestjs/common';
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

  async create(createJobDto: CreateJobDto): Promise<JobEntity> {
    // Create job in database with QUEUED status
    const job = await this.prisma.job.create({
      data: {
        deploymentId: createJobDto.deploymentId,
        inputJson: createJobDto.inputJson,
        status: 'QUEUED',
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
    });

    return jobs.map((job) => this.mapToEntity(job));
  }

  private mapToEntity(job: any): JobEntity {
    return {
      id: job.id,
      deploymentId: job.deploymentId,
      status: job.status,
      inputJson: job.inputJson as Record<string, any>,
      outputJson: job.outputJson as Record<string, any> | null,
      error: job.error,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
    };
  }
}
