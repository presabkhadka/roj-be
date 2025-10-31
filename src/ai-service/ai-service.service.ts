import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { embedMany } from 'ai';
import { google } from "@ai-sdk/google"
import cosineSimilarity from 'compute-cosine-similarity';

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

  getSimilarity(embeddingA: any, embeddingB: any): number {
    const similarity = cosineSimilarity(embeddingA, embeddingB);

    if (!similarity) {
      throw new InternalServerErrorException('Something went wrong while finding the similarity')
    }

    return similarity

  }

}
