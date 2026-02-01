import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { UsageController } from './usage.controller';
import { UsageService } from './usage.service';
import { UsageStorageService } from './usage-storage.service';
import { UsageLoggingMiddleware } from './usage-logging.middleware';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsageController],
  providers: [UsageService, UsageStorageService],
  exports: [UsageStorageService],
})
export class UsageModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply middleware to all routes
    consumer.apply(UsageLoggingMiddleware).forRoutes('*');
  }
}
