import { Test, TestingModule } from '@nestjs/testing';
import { DeploymentsService } from '../../deployments/deployments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('DeploymentsService', () => {
  let service: DeploymentsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    deployment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeploymentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DeploymentsService>(DeploymentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new deployment', async () => {
      const createDto = {
        modelName: 'gpt-4',
        configJson: { gpu: 'A100', memory: '16GB' },
      };
      const mockDeployment = {
        id: 'deployment-id',
        ...createDto,
        isActive: false,
        createdAt: new Date(),
      };

      mockPrismaService.deployment.create.mockResolvedValue(mockDeployment);

      const result = await service.create(createDto);

      expect(result).toEqual(mockDeployment);
      expect(prisma.deployment.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return array of deployments', async () => {
      const mockDeployments = [
        {
          id: 'dep-1',
          modelName: 'gpt-4',
          configJson: {},
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: 'dep-2',
          modelName: 'gpt-3',
          configJson: {},
          isActive: false,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.deployment.findMany.mockResolvedValue(mockDeployments);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(prisma.deployment.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('activate', () => {
    it('should activate a deployment and deactivate others', async () => {
      const id = 'deployment-id';
      const mockActivated = {
        id,
        modelName: 'gpt-4',
        configJson: {},
        isActive: true,
        createdAt: new Date(),
      };

      // Mock the transaction callback
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        mockPrismaService.deployment.updateMany.mockResolvedValue({ count: 2 });
        mockPrismaService.deployment.update.mockResolvedValue(mockActivated);
        return callback(mockPrismaService);
      });

      const result = await service.activate(id);

      expect(result).toBeDefined();
      expect(result.isActive).toBe(true);
      expect(result.id).toBe(id);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
