import { ApiProperty } from '@nestjs/swagger';

export class DeploymentEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  modelName: string;

  @ApiProperty()
  configJson: Record<string, any>;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;
}
