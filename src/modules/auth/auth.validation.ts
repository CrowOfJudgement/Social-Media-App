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

export const resendOtpSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
}

export type ResendOtp = z.infer<typeof resendOtpSchema['body']>

export const signInSchema = {
  body: resendOtpSchema.body.safeExtend({
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    fcm: z.string(),
  }),
}

export type SignIn = z.infer<typeof signInSchema['body']>

export const confirmEmailSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
  }),
}

export type ConfirmEmail = z.infer<typeof confirmEmailSchema['body']>

export const googleSignupSchema = {
  body: z.object({
    idToken: z.string().min(1, 'Google idToken is required'),
  }),
}

export type GoogleSignup = z.infer<typeof googleSignupSchema['body']>

export const forgetPasswordSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
}

export type ForgetPassword = z.infer<typeof forgetPasswordSchema['body']>

export const resetPasswordSchema = {
  body: z
    .object({
      email: z.string().email('Invalid email address'),
      otp: z.string().length(6, 'OTP must be 6 digits'),
      password: z.string().min(6, 'Password must be at least 6 characters long'),
      cPassword: z.string().min(6, 'Confirm password must be at least 6 characters long'),
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

export type ResetPassword = z.infer<typeof resetPasswordSchema['body']>

export const updatePasswordSchema = {
  body: z
    .object({
      oldPassword: z.string().min(6, 'Old password must be at least 6 characters long'),
      password: z.string().min(6, 'Password must be at least 6 characters long'),
      cPassword: z.string().min(6, 'Confirm password must be at least 6 characters long'),
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

export type UpdatePassword = z.infer<typeof updatePasswordSchema['body']>
