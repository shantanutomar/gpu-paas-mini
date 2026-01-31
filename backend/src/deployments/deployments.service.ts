import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { DeploymentEntity } from './entities/deployment.entity';

@Injectable()
export class DeploymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createDeploymentDto: CreateDeploymentDto,
  ): Promise<DeploymentEntity> {
    const deployment = await this.prisma.deployment.create({
      data: {
        modelName: createDeploymentDto.modelName,
        configJson: createDeploymentDto.configJson,
      },
    });

    return this.mapToEntity(deployment);
  }

  async findAll(): Promise<DeploymentEntity[]> {
    const deployments = await this.prisma.deployment.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return deployments.map((d) => this.mapToEntity(d));
  }

  async activate(id: string): Promise<DeploymentEntity> {
    // Use a transaction to ensure only one deployment is active
    const deployment = await this.prisma.$transaction(async (tx) => {
      // First, deactivate all deployments
      await tx.deployment.updateMany({
        where: {
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      // Then, activate the requested deployment
      const activated = await tx.deployment.update({
        where: { id },
        data: {
          isActive: true,
        },
      });

      return activated;
    });

    return this.mapToEntity(deployment);
  }

  private mapToEntity(deployment: any): DeploymentEntity {
    return {
      id: deployment.id,
      modelName: deployment.modelName,
      configJson: deployment.configJson as Record<string, any>,
      isActive: deployment.isActive,
      createdAt: deployment.createdAt,
    };
  }
}
