import { Router } from 'express'
import { authentication } from '../../common/middleware/authentication'
import { authorization } from '../../common/middleware/authorization'
import { Validation } from '../../common/middleware/validation'
import { RoleEnum } from '../../common/enum/user.enum'
import userService from './user.service'
import { getUsersSchema, updateProfileSchema, userIdSchema } from './user.validation'

const router = Router()

router.get('/', authentication, Validation(getUsersSchema), userService.getUsers)
router.get('/profile', authentication, userService.profile)
router.patch('/profile', authentication, Validation(updateProfileSchema), userService.updateProfile)
router.delete('/profile', authentication, userService.deleteProfile)
router.get('/admin-only', authentication, authorization(RoleEnum.Admin), userService.adminOnly)
router.get('/:id', authentication, Validation(userIdSchema), userService.getUserById)

export default router
