import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { embedMany, generateText } from 'ai';
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

  async createMockInterviewQuestions(title: string) {
    try {

      const prompt = `
        You are an AI assistant helping generate mock interview questions.
        Based on the job title "${title}", create 20 technical and 5 behavioral interview questions.
        Return the result as a structured JSON with keys "technical" and "behavioral".
      `;

      const { text } = await generateText({
        model: google('gemini-2.5-flash'),
        prompt
      })

      const cleanedText = text
        .replace(/```json/i, '')
        .replace(/```/g, '')
        .trim();

      return JSON.parse(cleanedText)

    } catch (error) {
      throw new Error(error)
    }
  }

}
