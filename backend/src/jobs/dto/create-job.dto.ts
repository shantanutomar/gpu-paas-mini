import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
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
}
