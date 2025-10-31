import { Injectable } from '@nestjs/common';
import { embedMany } from 'ai';
import { google } from "@ai-sdk/google"

@Injectable()
export class AiService {

  async generateEmbeddings(val: string[]) {
    try {
      const { embeddings } = await embedMany({
        model: google.textEmbeddingModel('text-embedding-004'),
        values: val
      })
      return embeddings
    } catch (error) {
      return error
    }
  }

}
