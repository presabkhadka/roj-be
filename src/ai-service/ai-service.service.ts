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

  async giveSuggestions(title: string) {
    try {

      const prompt = `You are AI assistant to give recommendation on what possible scenarios a rejected candidate got rejected and other got shortlisted and what can they work on to improve their skills on job title ${title}. Return the result in paragraphs, this generated paragraphs is supposed to be mail so dont make it too large, you are not supposed to generate a while mail template like thingy only generate description paragraph of what went wrong and where they can improve make it around 10 lines.`;

      const { text } = await generateText({
        model: google('gemini-2.5-flash'),
        prompt
      })

      return text.trim()

    } catch (error) {
      throw new Error(error)
    }
  }

}
