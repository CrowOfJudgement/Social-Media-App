import { Router } from 'express'
import { Validation } from '../../common/middleware/validation'
import { signInSchema, signUpSchema } from './auth.validation'
import authService from './auth.service'

const router = Router()

router.post('/signup', Validation(signUpSchema), authService.signup)
router.post('/signin', Validation(signInSchema), authService.signin)

export default router
