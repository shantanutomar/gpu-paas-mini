import { ApiProperty } from '@nestjs/swagger';

export class JobEntity {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  deploymentId: string | null;

  @ApiProperty({ enum: ['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED'] })
  status: string;

  @ApiProperty()
  inputJson: Record<string, any>;

  @ApiProperty({ nullable: true })
  outputJson: Record<string, any> | null;

  @ApiProperty({ nullable: true })
  error: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ nullable: true })
  startedAt: Date | null;

  @ApiProperty({ nullable: true })
  finishedAt: Date | null;
}
