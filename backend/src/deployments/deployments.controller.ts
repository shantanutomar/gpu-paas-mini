import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DeploymentsService } from './deployments.service';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { DeploymentEntity } from './entities/deployment.entity';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';

@ApiTags('deployments')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('api/deployments')
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new deployment' })
  @ApiResponse({
    status: 201,
    description: 'Deployment created successfully',
    type: DeploymentEntity,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createDeploymentDto: CreateDeploymentDto,
  ): Promise<DeploymentEntity> {
    return this.deploymentsService.create(createDeploymentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all deployments' })
  @ApiResponse({
    status: 200,
    description: 'List of deployments',
    type: [DeploymentEntity],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(): Promise<DeploymentEntity[]> {
    return this.deploymentsService.findAll();
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a deployment (deactivates others)' })
  @ApiResponse({
    status: 200,
    description: 'Deployment activated successfully',
    type: DeploymentEntity,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async activate(@Param('id') id: string): Promise<DeploymentEntity> {
    return this.deploymentsService.activate(id);
  }
}
