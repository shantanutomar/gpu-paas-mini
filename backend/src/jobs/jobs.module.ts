import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsEventsService } from './jobs-events.service';
import { JobsController } from './jobs.controller';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [ApiKeysModule],
  controllers: [JobsController],
  providers: [JobsService, JobsEventsService],
})
export class JobsModule {}
