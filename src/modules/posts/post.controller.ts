import { Router } from 'express'
import { authentication } from '../../common/middleware/authentication'
import { Validation } from '../../common/middleware/validation'
import postService from './post.service'
import { createPostSchema, postIdSchema, updatePostSchema } from './post.validation'

const router = Router()

router.post('/', authentication, Validation(createPostSchema), postService.createPost)
router.get('/', authentication, postService.getPosts)
router.get('/:id', authentication, Validation(postIdSchema), postService.getPostById)
router.patch('/:id', authentication, Validation(updatePostSchema), postService.updatePost)
router.delete('/:id', authentication, Validation(postIdSchema), postService.deletePost)

export default router
