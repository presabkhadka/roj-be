import z from 'zod'

import { UserTypes } from 'generated/prisma'

export const createUserSchema = z.object({
  firstName: z.string().min(3, 'Name cannot be shorter than 3 letter').max(10, 'Name cannot exceed more than 10 letters').nonoptional(),
  lastName: z.string().min(3, 'Name cannot be shorter than 3 letter').max(10, 'Name cannot exceed more than 10 letters').nonoptional(),
  username: z.string().min(3, 'Name cannot be shorter than 3 letter').max(10, 'Name cannot exceed more than 10 letters').nonoptional(),
  email: z.email().nonoptional(),
  password: z.string().min(8, 'Password should be minimum of 8 characters').max(16, 'Password cannot exceed more than 16 characters').nonoptional(),
  userTypes: z.nativeEnum(UserTypes).nonoptional(),
  skills: z.array(z.string()).optional(),
  embeddings: z.array(z.string()).optional()
})

export type createUserDto = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  firstName: z.string().min(3, 'Name cannot be shorter than 3 letter').max(10, 'Name cannot exceed more than 10 letters').optional(),
  lastName: z.string().min(3, 'Name cannot be shorter than 3 letter').max(10, 'Name cannot exceed more than 10 letters').optional(),
  username: z.string().min(3, 'Name cannot be shorter than 3 letter').max(10, 'Name cannot exceed more than 10 letters').optional(),
  email: z.email(),
  password: z.string().min(8, 'Password should be minimum of 8 characters').max(16, 'Password cannot exceed more than 16 characters').optional(),
  skills: z.array(z.string()).optional(),
  embeddings: z.array(z.string()).optional()
})

export type updateUserDto = z.infer<typeof updateUserSchema>

export const loginUserSchema = z.object({
  email: z.email().nonoptional(),
  password: z.string().min(8, 'Password should be minimum of 8 characters').max(16, 'Password cannot exceed more than 16 characters').nonoptional(),
})

export type loginUserDto = z.infer<typeof loginUserSchema>
