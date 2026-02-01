import { ApiProperty } from '@nestjs/swagger';

class EndpointStats {
  @ApiProperty()
  endpoint: string;

  @ApiProperty()
  total: number;

  @ApiProperty()
  errors: number;

  @ApiProperty()
  avgLatencyMs: number;
}

class ApiKeyStats {
  @ApiProperty()
  apiKeyId: string;

  @ApiProperty()
  total: number;

  @ApiProperty()
  errors: number;
}

export class UsageSummaryEntity {
  @ApiProperty()
  range: string;

  @ApiProperty()
  total: number;

  @ApiProperty()
  success: number;

  @ApiProperty()
  errors: number;

  @ApiProperty()
  avgLatencyMs: number;

  @ApiProperty()
  p95LatencyMs: number;

  @ApiProperty({ type: [EndpointStats] })
  byEndpoint: EndpointStats[];

  @ApiProperty({ type: [ApiKeyStats] })
  byApiKey: ApiKeyStats[];
}
