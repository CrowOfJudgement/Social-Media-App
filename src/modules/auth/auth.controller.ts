import { Router } from 'express'
import { authentication } from '../../common/middleware/authentication'
import multerCloud from '../../common/middleware/multer.cloud'
import { Validation } from '../../common/middleware/validation'
import {
  confirmEmailSchema,
  forgetPasswordSchema,
  googleSignupSchema,
  resendOtpSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from './auth.validation'
import authService from './auth.service'

const router = Router()

router.post('/signup', Validation(signUpSchema), authService.signup)
router.post('/confirm-email', Validation(confirmEmailSchema), authService.confirmEmail)
router.post('/signin', Validation(signInSchema), authService.signin)
router.post('/resend-otp', Validation(resendOtpSchema), authService.reSendOtp)
router.post('/signup-google', Validation(googleSignupSchema), authService.signUpWithGmail)
router.post('/login-google', Validation(googleSignupSchema), authService.loginWithGmail)
router.post('/forget-password', Validation(forgetPasswordSchema), authService.forgetPassword)
router.post('/reset-password', Validation(resetPasswordSchema), authService.resetPassword)
router.patch('/update-password', authentication, Validation(updatePasswordSchema), authService.updatePassword)
router.post('/logout', authentication, authService.logout)
router.post('/upload', authentication, multerCloud({}).array('files'), authService.uploadImage)

export default router
