import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UsageEventEntity {
  @ApiProperty()
  timestamp: string;

  @ApiProperty()
  method: string;

  @ApiProperty()
  path: string;

  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  durationMs: number;

  @ApiProperty({ nullable: true })
  apiKeyId: string | null;

  @ApiPropertyOptional()
  errorMessage?: string;
}
