import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsageService } from './usage.service';
import { GetUsageEventsDto } from './dto/get-usage-events.dto';
import { GetUsageSummaryDto } from './dto/get-usage-summary.dto';
import { UsageEventEntity } from './entity/usage-event.entity';
import { UsageSummaryEntity } from './entity/usage-summary.entity';

@ApiTags('usage')
@Controller('api/usage')
export class UsageController {
  constructor(private usageService: UsageService) {}

  @Get('events')
  @ApiOperation({ summary: 'Get usage events with filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns filtered usage events',
    type: [UsageEventEntity],
  })
  getEvents(@Query() query: GetUsageEventsDto): UsageEventEntity[] {
    return this.usageService.getEvents({
      range: query.range,
      endpoint: query.endpoint,
      apiKeyId: query.apiKeyId,
      limit: query.limit,
    });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get usage summary with aggregations' })
  @ApiResponse({
    status: 200,
    description: 'Returns usage summary',
    type: UsageSummaryEntity,
  })
  getSummary(@Query() query: GetUsageSummaryDto): UsageSummaryEntity {
    return this.usageService.getSummary(query.range);
  }
}
