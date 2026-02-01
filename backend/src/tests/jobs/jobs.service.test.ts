import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from '../../jobs/jobs.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueService } from '../../queue/queue.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('JobsService', () => {
  let service: JobsService;
  let prisma: PrismaService;
  let queueService: QueueService;

  const mockPrismaService = {
    job: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockQueueService = {
    addJob: jest.fn(),
    removeJob: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    prisma = module.get<PrismaService>(PrismaService);
    queueService = module.get<QueueService>(QueueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and queue a new job', async () => {
      const createDto = {
        inputJson: { prompt: 'Hello' },
        deploymentId: 'dep-id',
      };
      const mockJob = {
        id: 'job-id',
        ...createDto,
        status: 'QUEUED',
        outputJson: null,
        error: null,
        createdAt: new Date(),
        startedAt: null,
        finishedAt: null,
        cancelledAt: null,
        timeoutMs: 60000,
        attempt: 1,
        maxAttempts: 1,
        retryDelayMs: 1000,
        idempotencyKey: null,
      };

      mockPrismaService.job.create.mockResolvedValue(mockJob);
      mockQueueService.addJob.mockResolvedValue(undefined);

      const result = await service.create(createDto);

      expect(result).toHaveProperty('id', 'job-id');
      expect(result).toHaveProperty('status', 'QUEUED');
      expect(prisma.job.create).toHaveBeenCalled();
      expect(queueService.addJob).toHaveBeenCalledWith('job-id');
    });

    it('should handle idempotency key', async () => {
      const createDto = {
        inputJson: { prompt: 'Hello' },
      };
      const idempotencyKey = 'unique-key';
      const existingJob = {
        id: 'existing-job',
        inputJson: { prompt: 'Hello' },
        status: 'SUCCEEDED',
        createdAt: new Date(),
        idempotencyKey,
      };

      mockPrismaService.job.findUnique.mockResolvedValue(existingJob);

      const result = await service.create(createDto, idempotencyKey);

      expect(result).toHaveProperty('id', 'existing-job');
      expect(prisma.job.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException for mismatched idempotency', async () => {
      const createDto = {
        inputJson: { prompt: 'Hello' },
      };
      const idempotencyKey = 'unique-key';
      const existingJob = {
        id: 'existing-job',
        inputJson: { prompt: 'Different' },
        idempotencyKey,
      };

      mockPrismaService.job.findUnique.mockResolvedValue(existingJob);

      await expect(service.create(createDto, idempotencyKey)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return array of jobs', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          status: 'SUCCEEDED',
          inputJson: {},
          outputJson: {},
          createdAt: new Date(),
        },
        {
          id: 'job-2',
          status: 'QUEUED',
          inputJson: {},
          outputJson: null,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.job.findMany.mockResolvedValue(mockJobs);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(prisma.job.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
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
    });
  });

  describe('cancel', () => {
    it('should cancel a queued job', async () => {
      const jobId = 'job-id';
      const mockJob = {
        id: jobId,
        status: 'QUEUED',
      };
      const mockCancelled = {
        ...mockJob,
        status: 'CANCELLED',
        cancelledAt: new Date(),
        finishedAt: new Date(),
        error: 'Job cancelled by user',
      };

      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.job.update.mockResolvedValue(mockCancelled);

      const result = await service.cancel(jobId);

      expect(result.status).toBe('CANCELLED');
      expect(prisma.job.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent job', async () => {
      mockPrismaService.job.findUnique.mockResolvedValue(null);

      await expect(service.cancel('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException for terminal state job', async () => {
      const mockJob = {
        id: 'job-id',
        status: 'SUCCEEDED',
      };

      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);

      await expect(service.cancel('job-id')).rejects.toThrow(ConflictException);
    });
  });
});
