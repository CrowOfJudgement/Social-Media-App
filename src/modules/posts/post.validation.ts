import * as z from 'zod'
import { AvailabilityEnum } from '../../common/enum/user.enum'

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid MongoDB ObjectId')

export const createPostSchema = {
  body: z.object({
    content: z.string().trim().min(1, 'Post content is required'),
    availability: z.enum(AvailabilityEnum).optional(),
    tags: z.array(objectIdSchema).optional(),
  }),
}

export type CreatePost = z.infer<typeof createPostSchema['body']>

export const postIdSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
}

export type PostIdParams = z.infer<typeof postIdSchema['params']>

export const updatePostSchema = {
  params: postIdSchema.params,
  body: z.object({
    content: z.string().trim().min(1, 'Post content is required').optional(),
    availability: z.enum(AvailabilityEnum).optional(),
    tags: z.array(objectIdSchema).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field is required to update the post',
  }),
}

export type UpdatePost = z.infer<typeof updatePostSchema['body']>
