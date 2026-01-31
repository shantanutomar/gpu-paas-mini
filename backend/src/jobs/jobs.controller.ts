import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Sse,
  MessageEvent,
  NotFoundException,
} from '@nestjs/common';
import { Observable, interval, merge } from 'rxjs';
import { map, takeUntil, startWith } from 'rxjs/operators';
import { JobsService } from './jobs.service';
import { JobsEventsService } from './jobs-events.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JobEntity } from './entities/job.entity';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiProduces,
} from '@nestjs/swagger';

@ApiTags('jobs')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('api/jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jobsEventsService: JobsEventsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new job' })
  @ApiResponse({
    status: 201,
    description: 'Job created and queued successfully',
    type: JobEntity,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createJobDto: CreateJobDto): Promise<JobEntity> {
    return this.jobsService.create(createJobDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get latest 20 jobs' })
  @ApiResponse({
    status: 200,
    description: 'List of jobs',
    type: [JobEntity],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(): Promise<JobEntity[]> {
    return this.jobsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a job by ID' })
  @ApiResponse({
    status: 200,
    description: 'Job details',
    type: JobEntity,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id') id: string): Promise<JobEntity> {
    return this.jobsService.findOne(id);
  }

  @Sse(':id/events')
  @ApiOperation({
    summary: 'Stream job status updates via Server-Sent Events (SSE)',
    description:
      'Returns a text/event-stream that sends real-time job status updates. ' +
      'Sends initial job state immediately, then streams updates as the job progresses. ' +
      'Heartbeat comments are sent every 15 seconds to keep the connection alive.',
  })
  @ApiProduces('text/event-stream')
  @ApiResponse({
    status: 200,
    description: 'SSE stream of job status events',
    content: {
      'text/event-stream': {
        schema: {
          type: 'object',
          properties: {
            event: { type: 'string', example: 'status' },
            data: {
              type: 'object',
              properties: {
                jobId: { type: 'string' },
                status: {
                  type: 'string',
                  enum: ['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED'],
                },
                ts: { type: 'string', format: 'date-time' },
                outputJson: { type: 'object', nullable: true },
                error: { type: 'string', nullable: true },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async streamJobEvents(
    @Param('id') id: string,
  ): Promise<Observable<MessageEvent>> {
    // Check if job exists
    const currentState = await this.jobsEventsService.getCurrentJobState(id);
    if (!currentState) {
      throw new NotFoundException(`Job with id ${id} not found`);
    }

    // Get the subject for this job
    const jobSubject = this.jobsEventsService.getJobEvents(id);

    // Create heartbeat observable (every 15 seconds)
    const heartbeat$ = interval(15000).pipe(
      map(() => ({
        data: { type: 'heartbeat', ts: new Date().toISOString() },
        type: 'heartbeat',
      })),
    );

    // Create job events observable
    const jobEvents$ = jobSubject.pipe(
      map((event) => ({
        data: event,
        type: 'status',
      })),
    );

    // Merge job events and heartbeat, starting with current state
    return merge(jobEvents$, heartbeat$).pipe(
      startWith({
        data: currentState,
        type: 'status',
      }),
    );
  }
}
