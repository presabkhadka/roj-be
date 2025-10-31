import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { AiServiceModule } from 'src/ai-service/ai-service.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [AiServiceModule, UsersModule],
  controllers: [JobsController],
  providers: [JobsService]
})
export class JobsModule { }
