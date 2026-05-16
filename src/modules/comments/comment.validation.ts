import * as z from 'zod'

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid MongoDB ObjectId')

export const createCommentSchema = {
  body: z.object({
    content: z.string().trim().min(1, 'Comment content is required'),
    postId: objectIdSchema,
  }),
}

export const commentIdSchema = {
  params: z.object({
    id: objectIdSchema,
  }),
}

export const postCommentsSchema = {
  params: z.object({
    postId: objectIdSchema,
  }),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
}

export const updateCommentSchema = {
  params: commentIdSchema.params,
  body: z
    .object({
      content: z.string().trim().min(1, 'Comment content is required'),
    }),
}

export type CreateComment = z.infer<typeof createCommentSchema['body']>
export type UpdateComment = z.infer<typeof updateCommentSchema['body']>
export type PostCommentsQuery = z.infer<typeof postCommentsSchema['query']>
