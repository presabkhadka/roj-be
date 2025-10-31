import { Module } from '@nestjs/common';
import { AiService } from './ai-service.service';

@Module({
  providers: [AiService],
  exports: [AiService]
})
export class AiServiceModule { }
