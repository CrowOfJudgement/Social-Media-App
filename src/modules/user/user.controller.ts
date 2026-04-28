import { Router } from 'express'
import { authentication } from '../../common/middleware/authentication'
import { authorization } from '../../common/middleware/authorization'
import { RoleEnum } from '../../common/enum/user.enum'
import userService from './user.service'

const router = Router()

router.get('/profile', authentication, userService.profile)
router.get('/admin-only', authentication, authorization(RoleEnum.Admin), userService.adminOnly)

export default router
