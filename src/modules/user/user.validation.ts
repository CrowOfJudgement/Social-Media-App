import * as z from 'zod'
import { GenderEnum } from '../../common/enum/user.enum'

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid MongoDB ObjectId')

export const userIdSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
}

export const getUsersSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    search: z.string().trim().optional(),
  }),
}

export const updateProfileSchema = {
  body: z
    .object({
      userName: z.string().trim().min(3, 'Username must be at least 3 characters long').optional(),
      phone: z.string().trim().optional(),
      address: z.string().trim().optional(),
      age: z.number().int().positive().optional(),
      gender: z.enum(GenderEnum).optional(),
    })
    .refine(data => Object.keys(data).length > 0, {
      message: 'At least one field is required to update profile',
    }),
}

export type UserIdParams = z.infer<typeof userIdSchema['params']>
export type GetUsersQuery = z.infer<typeof getUsersSchema['query']>
export type UpdateProfile = z.infer<typeof updateProfileSchema['body']>
