import { IsNotEmpty, IsString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDeploymentDto {
  @ApiProperty({ description: 'Name of the model to deploy' })
  @IsString()
  @IsNotEmpty()
  modelName: string;

  @ApiProperty({
    description: 'Configuration JSON for the deployment',
    example: { gpu: 'A100', memory: '16GB' },
  })
  @IsObject()
  @IsNotEmpty()
  configJson: Record<string, any>;
}
