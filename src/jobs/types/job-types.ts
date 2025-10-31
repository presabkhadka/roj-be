export interface SimilarityResult {
  userId: string;
  userName: string;
  email: string;
  jobId: string;
  jobTitle: string;
  matchedSkills: number;
  maxSimilarity: number;
}
