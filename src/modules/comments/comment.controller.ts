import { Router } from 'express'
import { authentication } from '../../common/middleware/authentication'
import { Validation } from '../../common/middleware/validation'
import commentService from './comment.service'
import {
  commentIdSchema,
  createCommentSchema,
  postCommentsSchema,
  updateCommentSchema,
} from './comment.validation'

const router = Router()

router.post('/', authentication, Validation(createCommentSchema), commentService.createComment)
router.get('/post/:postId', authentication, Validation(postCommentsSchema), commentService.getCommentsByPost)
router.get('/:id', authentication, Validation(commentIdSchema), commentService.getCommentById)
router.patch('/:id', authentication, Validation(updateCommentSchema), commentService.updateComment)
router.delete('/:id', authentication, Validation(commentIdSchema), commentService.deleteComment)

export default router
