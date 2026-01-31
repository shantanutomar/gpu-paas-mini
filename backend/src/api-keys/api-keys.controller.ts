import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ApiKeyEntity, ApiKeyWithPlaintext } from './entities/api-key.entity';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('api-keys')
@Controller('api/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({
    status: 201,
    description: 'API key created successfully',
    type: ApiKeyWithPlaintext,
  })
  async create(
    @Body() createApiKeyDto: CreateApiKeyDto,
  ): Promise<ApiKeyWithPlaintext> {
    return this.apiKeysService.create(createApiKeyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all API keys' })
  @ApiResponse({
    status: 200,
    description: 'List of API keys',
    type: [ApiKeyEntity],
  })
  async findAll(): Promise<ApiKeyEntity[]> {
    return this.apiKeysService.findAll();
  }

  @Post(':id/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiResponse({
    status: 200,
    description: 'API key revoked successfully',
    type: ApiKeyEntity,
  })
  async revoke(@Param('id') id: string): Promise<ApiKeyEntity> {
    return this.apiKeysService.revoke(id);
  }
}
