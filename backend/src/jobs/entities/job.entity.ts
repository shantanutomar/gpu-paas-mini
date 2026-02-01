import { ApiProperty } from '@nestjs/swagger';

export class JobEntity {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  deploymentId: string | null;

  @ApiProperty({ nullable: true, required: false })
  deployment?: {
    id: string;
    modelName: string;
  } | null;

  @ApiProperty({
    enum: [
      'QUEUED',
      'RUNNING',
      'SUCCEEDED',
      'FAILED',
      'CANCELLED',
      'CANCEL_REQUESTED',
      'TIMED_OUT',
    ],
  })
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

  @ApiProperty({ nullable: true })
  cancelledAt: Date | null;

  @ApiProperty()
  timeoutMs: number;

  @ApiProperty()
  attempt: number;

  @ApiProperty()
  maxAttempts: number;

  @ApiProperty({ nullable: true })
  retryDelayMs: number | null;

  @ApiProperty({ nullable: true })
  idempotencyKey: string | null;
}
