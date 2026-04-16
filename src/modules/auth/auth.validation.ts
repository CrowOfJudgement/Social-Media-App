import * as z from 'zod'
import { GenderEnum } from '../../common/enum/user.enum'

export const signUpSchema = {
  body: z
    .object({
      userName: z.string().min(3, 'Username must be at least 3 characters long'),
      email: z.string().email('Invalid email address'),
      password: z.string().min(6, 'Password must be at least 6 characters long'),
      cPassword: z.string().min(6, 'Confirm password must be at least 6 characters long'),
      phone: z.string().optional(),
      address: z.string().optional(),
      age: z.number().int().positive().optional(),
      gender: z.enum(GenderEnum).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.password !== data.cPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cPassword'],
          message: 'Passwords do not match',
        })
      }
    }),
}

export type SignUp = z.infer<typeof signUpSchema['body']>

export const signInSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  }),
}

export type SignIn = z.infer<typeof signInSchema['body']>
