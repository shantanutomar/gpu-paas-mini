import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJobDto {
  @ApiProperty({ description: 'Deployment ID (optional)', required: false })
  @IsString()
  @IsOptional()
  deploymentId?: string;

  @ApiProperty({
    description: 'Input JSON payload for the job',
    example: { prompt: 'Hello world', max_tokens: 100 },
  })
  @IsObject()
  @IsNotEmpty()
  inputJson: Record<string, any>;

  @ApiProperty({
    description: 'Timeout in milliseconds (default: 60000)',
    required: false,
    default: 60000,
    minimum: 1000,
    maximum: 600000,
  })
  @IsInt()
  @Min(1000)
  @Max(600000)
  @IsOptional()
  timeoutMs?: number;

  @ApiProperty({
    description: 'Maximum number of retry attempts (default: 1)',
    required: false,
    default: 1,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  maxAttempts?: number;

  @ApiProperty({
    description: 'Initial retry delay in milliseconds (default: 1000)',
    required: false,
    default: 1000,
    minimum: 100,
    maximum: 60000,
  })
  @IsInt()
  @Min(100)
  @Max(60000)
  @IsOptional()
  retryDelayMs?: number;
}
