import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { JobsModule } from './jobs/jobs.module';
import { AiServiceModule } from './ai-service/ai-service.module';

@Module({
  imports: [UsersModule, PrismaModule, JobsModule, AiServiceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
