import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetUsageEventsDto {
  @ApiPropertyOptional({
    enum: ['15m', '1h', '24h'],
    default: '1h',
    description: 'Time range for events',
  })
  @IsOptional()
  @IsString()
  range?: string;

  @ApiPropertyOptional({
    description: 'Filter by exact endpoint path',
  })
  @IsOptional()
  @IsString()
  endpoint?: string;

  @ApiPropertyOptional({
    description: 'Filter by API key ID',
  })
  @IsOptional()
  @IsString()
  apiKeyId?: string;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 1000,
    default: 200,
    description: 'Maximum number of events to return',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;
}
