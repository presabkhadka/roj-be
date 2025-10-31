import z from 'zod'

export const createJobSchema = z.object({
  title: z.string().min(4, 'Job title must be minimum of 4 characters').max(20, 'Job title cannot exceed more than 20 characters').nonoptional(),
  description: z.string().min(24, 'Job description must be minimum of 24 characters').max(50, 'Job description cannot exceed more than 50 characters').nonoptional(),
  createdAt: z.date().nonoptional(),
  closedAt: z.date().optional(),
  userId: z.string().nonoptional(),
  category: z.array(z.string()).nonoptional(),
  embeddings: z.any().optional()
})

export type createJobDto = z.infer<typeof createJobSchema>

export const updateJobSchema = z.object({
  title: z.string().min(4, 'Job title must be minimum of 4 characters').max(20, 'Job title cannot exceed more than 20 characters').optional(),
  description: z.string().min(24, 'Job description must be minimum of 24 characters').max(50, 'Job description cannot exceed more than 50 characters').optional(),
  createdAt: z.date().optional(),
  closedAt: z.date().optional(),
  userId: z.string().optional(),
  category: z.array(z.string()).optional(),
  embeddings: z.any().optional()
})

export type updateJobDto = z.infer<typeof updateJobSchema>
