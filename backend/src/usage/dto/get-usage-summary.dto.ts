import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetUsageSummaryDto {
  @ApiPropertyOptional({
    enum: ['15m', '1h', '24h'],
    default: '1h',
    description: 'Time range for summary',
  })
  @IsOptional()
  @IsString()
  range?: string;
}
