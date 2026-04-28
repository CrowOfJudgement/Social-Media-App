import { NextFunction, Request, Response } from 'express'
import { OAuth2Client, TokenPayload } from 'google-auth-library'
import { HydratedDocument } from 'mongoose'
import { randomBytes } from 'node:crypto'
import { emailEnum } from '../../common/enum/email.enum'
import { ProviderEnum } from '../../common/enum/user.enum'
import redisService from '../../common/service/redis.service'
import { otpEmailTemplate } from '../../common/utils/email/email.template'
import { sendEmail, generateOtp } from '../../common/utils/email/send.email'
import { appError } from '../../common/utils/global-error-handlier'
import { compareHash } from '../../common/utils/security/hash'
import { signToken } from '../../common/utils/security/token'
import { IUser } from '../../DB/models/user.model'
import { GOOGLE_CLIENT_ID } from '../../confing/config.service'
import userRepository from '../../DB/repositories/user.repository'
import {
  ConfirmEmail,
  ForgetPassword,
  GoogleSignup,
  ResendOtp,
  ResetPassword,
  SignIn,
  SignUp,
  UpdatePassword,
} from './auth.validation'

type SignupRequestBody = SignUp
type SigninRequestBody = SignIn
type ResendOtpRequestBody = ResendOtp
type GoogleSignupRequestBody = GoogleSignup
type ConfirmEmailRequestBody = ConfirmEmail
type ForgetPasswordRequestBody = ForgetPassword
type ResetPasswordRequestBody = ResetPassword
type UpdatePasswordRequestBody = UpdatePassword

class AuthService {
  private readonly _userModel = new userRepository()
  private readonly otpExpiresInSeconds = 10 * 60

  constructor() {}

  private readonly sanitizeUser = (user: HydratedDocument<IUser>) => {
    const userObject = user.toObject()
    const { password: _password, ...safeUser } = userObject
    return safeUser
  }

  private readonly sendEmailOtp = async ({
    email,
    subject = emailEnum.confirmEmail,
  }: {
    email: string
    subject?: emailEnum
  }) => {
    const otp = generateOtp()
    const title = subject === emailEnum.confirmEmail ? 'Confirm your email' : 'Reset your password'
    const subtitle =
      subject === emailEnum.confirmEmail
        ? 'Use this code to finish setting up your account'
        : 'Use this code to reset your account password'

    await sendEmail({
      to: email,
      subject: title,
      html: otpEmailTemplate({
        title,
        subtitle,
        otp,
      }),
    })

    const otpKey = redisService.otp_key({ email, subject })
    await redisService.setValue({
      key: otpKey,
      value: otp.toString(),
      ttl: this.otpExpiresInSeconds,
    })

    return { otp: otp.toString(), subject }
  }

  private readonly createTokenPayload = (user: HydratedDocument<IUser>) => {
    return {
      sub: user._id.toString(),
      email: user.email,
      role: user.role!,
      provider: user.provider!,
    }
  }

  private readonly createAuthResponse = (user: HydratedDocument<IUser>, message: string) => {
    const accessToken = signToken(this.createTokenPayload(user))

    return {
      message,
      accessToken,
      user: this.sanitizeUser(user),
    }
  }

  signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userName, email, password, phone, address, age, gender }: SignupRequestBody =
        req.body

      await this._userModel.isEmailExists(email)

      const user: HydratedDocument<IUser> = await this._userModel.create({
        userName,
        email,
        password,
        phone,
        address,
        age,
        gender,
      } as Partial<IUser>)

      await this.sendEmailOtp({ email, subject: emailEnum.confirmEmail })

      res.status(200).json({
        message: 'Signup successful. Confirmation OTP sent to your email',
        user: this.sanitizeUser(user),
      })
    } catch (error) {
      next(error)
    }
  }

  signin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password }: SigninRequestBody = req.body

      const user = await this._userModel.findOne({
        filter: { email },
        projection: '+password',
      })
      if (!user) {
        throw new appError('Invalid credentials', 401)
      }

      const match = await compareHash(password, user.password)
      if (!match) {
        throw new appError('Invalid credentials', 401)
      }

      if (user.provider === ProviderEnum.Local && !user.isConfirmed) {
        throw new appError('Please confirm your email first', 403)
      }

      res.status(200).json(this.createAuthResponse(user, 'Signin successful'))
    } catch (error) {
      next(error)
    }
  }

  confirmEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, otp }: ConfirmEmailRequestBody = req.body

      const user = await this._userModel.findOne({
        filter: { email, provider: ProviderEnum.Local },
      })

      if (!user) {
        throw new appError('User not found', 404)
      }

      if (user.isConfirmed) {
        throw new appError('Email already confirmed', 409)
      }

      const otpKey = redisService.otp_key({ email, subject: emailEnum.confirmEmail })
      const storedOtp = await redisService.getValue(otpKey)

      if (!storedOtp || storedOtp !== otp) {
        throw new appError('Invalid or expired OTP', 400)
      }

      user.isConfirmed = true
      await user.save()
      await redisService.deleteKey(otpKey)

      res.status(200).json(this.createAuthResponse(user, 'Email confirmed successfully'))
    } catch (error) {
      next(error)
    }
  }

  reSendOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email }: ResendOtpRequestBody = req.body

      const user = await this._userModel.findOne({
        filter: { email, isConfirmed: false, provider: ProviderEnum.Local },
      })

      if (!user) {
        throw new appError('User does not exist or is already confirmed', 404)
      }

      await this.sendEmailOtp({ email, subject: emailEnum.confirmEmail })

      res.status(200).json({ message: 'OTP resent successfully' })
    } catch (error) {
      next(error)
    }
  }

  signUpWithGmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = await this.verifyGoogleAccount(req.body.idToken)
      const name = payload.name
      const email = payload.email as string
      const emailVerified = payload.email_verified

      let user = await this._userModel.findOne({ filter: { email } })

      if (!user) {
        user = await this._userModel.create({
          userName: name || email.split('@')[0],
          email,
          password: randomBytes(32).toString('hex'),
          isConfirmed: emailVerified ?? true,
          provider: ProviderEnum.Google,
        } as Partial<IUser>)
      }

      if (user.provider === ProviderEnum.Local) {
        throw new appError('This email is already registered with local authentication', 409)
      }

      res.status(200).json(this.createAuthResponse(user, 'Google signup successful'))
    } catch (error) {
      next(error)
    }
  }

  loginWithGmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = await this.verifyGoogleAccount(req.body.idToken)
      const email = payload.email as string

      const user = await this._userModel.findOne({ filter: { email, provider: ProviderEnum.Google } })
      if (!user) {
        throw new appError('No Google account found for this email', 404)
      }

      res.status(200).json(this.createAuthResponse(user, 'Google login successful'))
    } catch (error) {
      next(error)
    }
  }

  forgetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email }: ForgetPasswordRequestBody = req.body

      const user = await this._userModel.findOne({
        filter: { email, provider: ProviderEnum.Local },
      })

      if (!user) {
        throw new appError('User not found', 404)
      }

      await this.sendEmailOtp({ email, subject: emailEnum.forgetPassword })

      res.status(200).json({ message: 'Password reset OTP sent successfully' })
    } catch (error) {
      next(error)
    }
  }

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, otp, password }: ResetPasswordRequestBody = req.body

      const user = await this._userModel.findOne({
        filter: { email, provider: ProviderEnum.Local },
        projection: '+password',
      })

      if (!user) {
        throw new appError('User not found', 404)
      }

      const otpKey = redisService.otp_key({ email, subject: emailEnum.forgetPassword })
      const storedOtp = await redisService.getValue(otpKey)

      if (!storedOtp || storedOtp !== otp) {
        throw new appError('Invalid or expired OTP', 400)
      }

      user.password = password
      await user.save()
      await redisService.deleteKey(otpKey)

      res.status(200).json({ message: 'Password reset successfully' })
    } catch (error) {
      next(error)
    }
  }

  updatePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, password }: UpdatePasswordRequestBody = req.body
      const userId = req.decoded?.sub

      if (!userId) {
        throw new appError('Unauthorized', 401)
      }

      const user = await this._userModel.findOne({
        filter: { _id: userId, provider: ProviderEnum.Local },
        projection: '+password',
      })

      if (!user) {
        throw new appError('User not found', 404)
      }

      const match = await compareHash(oldPassword, user.password)
      if (!match) {
        throw new appError('Old password is incorrect', 400)
      }

      user.password = password
      await user.save()

      res.status(200).json({ message: 'Password updated successfully' })
    } catch (error) {
      next(error)
    }
  }

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenExp = req.decoded?.exp
      const tokenJti = req.decoded?.jti

      if (!tokenExp || !tokenJti) {
        throw new appError('Invalid token payload', 401)
      }

      const now = Math.floor(Date.now() / 1000)
      const remainingTime = tokenExp - now

      await redisService.setValue({
        key: `revoked_token:${tokenJti}`,
        value: 'true',
        ttl: remainingTime > 0 ? remainingTime : 1,
      })

      res.status(200).json({ message: 'Logged out successfully' })
    } catch (error) {
      next(error)
    }
  }

  private readonly verifyGoogleAccount = async (idToken: string) => {
    if (!GOOGLE_CLIENT_ID) {
      throw new appError('Google client ID is not configured', 500)
    }

    const client = new OAuth2Client()
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload?.email) {
      throw new appError('Unable to read Google account email', 400)
    }

    return payload
  }
}

const authService = new AuthService()

export default authService
