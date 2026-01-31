import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ApiKeyEntity, ApiKeyWithPlaintext } from './entities/api-key.entity';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createApiKeyDto: CreateApiKeyDto): Promise<ApiKeyWithPlaintext> {
    // Generate a secure random plaintext key (32 bytes = 64 hex chars)
    const plaintextKey = randomBytes(32).toString('hex');

    // Hash the key using SHA-256
    const keyHash = this.hashKey(plaintextKey);

    // Store in database
    const apiKey = await this.prisma.apiKey.create({
      data: {
        name: createApiKeyDto.name,
        keyHash,
      },
    });

    // Return the plaintext key only once
    return {
      id: apiKey.id,
      name: apiKey.name,
      key: plaintextKey,
      createdAt: apiKey.createdAt,
      revokedAt: apiKey.revokedAt,
    };
  }

  async findAll(): Promise<ApiKeyEntity[]> {
    const apiKeys = await this.prisma.apiKey.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        revokedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return apiKeys;
  }

  async revoke(id: string): Promise<ApiKeyEntity> {
    const apiKey = await this.prisma.apiKey.update({
      where: { id },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      id: apiKey.id,
      name: apiKey.name,
      createdAt: apiKey.createdAt,
      revokedAt: apiKey.revokedAt,
    };
  }

  async validateKey(plaintextKey: string): Promise<string | null> {
    const keyHash = this.hashKey(plaintextKey);

    const apiKey = await this.prisma.apiKey.findUnique({
      where: {
        keyHash,
      },
    });

    // Check if key exists and is not revoked
    if (apiKey && !apiKey.revokedAt) {
      return apiKey.id;
    }

    return null;
  }

  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }
}
