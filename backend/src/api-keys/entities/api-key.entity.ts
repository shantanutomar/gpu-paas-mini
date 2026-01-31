import { ApiProperty } from '@nestjs/swagger';

export class ApiKeyEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ nullable: true })
  revokedAt: Date | null;
}

export class ApiKeyWithPlaintext extends ApiKeyEntity {
  @ApiProperty({ description: 'Plaintext key (only shown once on creation)' })
  key: string;
}
