import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';
import { AiServiceModule } from 'src/ai-service/ai-service.module';

@Module({
  imports: [AiServiceModule],
  controllers: [UsersController],
  providers: [UsersService, JwtService],
})
export class UsersModule { }
