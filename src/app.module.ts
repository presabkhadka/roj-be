import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { JobsModule } from './jobs/jobs.module';
import { AiServiceModule } from './ai-service/ai-service.module';
import { MailerModule } from '@nestjs-modules/mailer'

@Module({
  imports: [UsersModule, PrismaModule, JobsModule, AiServiceModule, MailerModule.forRoot({
    transport: {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL,
        pass: process.env.APP_PASSWORD,
      },
      defaults: {
        from: '"Job Matcher" <no-reply@gmail.com>'
      }
    }
  })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
