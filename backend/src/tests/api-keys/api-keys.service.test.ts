import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeysService } from '../../api-keys/api-keys.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let prisma: PrismaService;

  const mockPrismaService = {
    apiKey: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ApiKeysService>(ApiKeysService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new API key', async () => {
      const createDto = { name: 'Test Key' };
      const mockApiKey = {
        id: 'test-id',
        name: 'Test Key',
        keyHash: 'hashed-key',
        createdAt: new Date(),
        revokedAt: null,
      };

      mockPrismaService.apiKey.create.mockResolvedValue(mockApiKey);

      const result = await service.create(createDto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', 'Test Key');
      expect(result).toHaveProperty('key');
      expect(result.key).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(prisma.apiKey.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return array of API keys', async () => {
      const mockKeys = [
        {
          id: 'key-1',
          name: 'Key 1',
          createdAt: new Date(),
          revokedAt: null,
        },
        {
          id: 'key-2',
          name: 'Key 2',
          createdAt: new Date(),
          revokedAt: new Date(),
        },
      ];

      mockPrismaService.apiKey.findMany.mockResolvedValue(mockKeys);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('keyHash');
      expect(prisma.apiKey.findMany).toHaveBeenCalled();
    });
  });

  describe('revoke', () => {
    it('should revoke an API key', async () => {
      const id = 'test-id';
      const mockRevokedKey = {
        id,
        name: 'Test Key',
        createdAt: new Date(),
        revokedAt: new Date(),
      };

      mockPrismaService.apiKey.update.mockResolvedValue(mockRevokedKey);

      const result = await service.revoke(id);

      expect(result.revokedAt).toBeDefined();
      expect(result.id).toBe(id);
      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('validateKey', () => {
    it('should return null for non-existent key', async () => {
      const plainKey = 'test-key';

      mockPrismaService.apiKey.findUnique.mockResolvedValue(null);

      const result = await service.validateKey(plainKey);

      expect(result).toBeNull();
      expect(prisma.apiKey.findUnique).toHaveBeenCalled();
    });

    it('should return null for revoked key', async () => {
      const plainKey = 'test-key';
      const mockRevokedKey = {
        id: 'test-id',
        keyHash: 'some-hash',
        revokedAt: new Date(),
      };

      mockPrismaService.apiKey.findUnique.mockResolvedValue(mockRevokedKey);

      const result = await service.validateKey(plainKey);

      expect(result).toBeNull();
    });
  });
});
