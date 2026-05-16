import { NextFunction, Request, Response } from 'express'
import { Types } from 'mongoose'
import { AvailabilityEnum } from '../../common/enum/user.enum'
import { appError } from '../../common/utils/global-error-handlier'
import { successResponse } from '../../common/utils/response.sucsess'
import CommentRepository from '../../DB/repositories/comment.repository'
import PostRepository from '../../DB/repositories/post.repository'
import type { CreateCommentDto, UpdateCommentDto } from './comment.dto'
import type { PostCommentsQuery } from './comment.validation'

class CommentService {
  private readonly _commentRepo = new CommentRepository()
  private readonly _postRepo = new PostRepository()

  private postAvailability(req: Request) {
    if (!req.user?._id) {
      throw new appError('Unauthorized', 401)
    }

    return [
      { availability: AvailabilityEnum.Public },
      { availability: AvailabilityEnum.Private, createdBy: req.user._id },
      { availability: AvailabilityEnum.Friends, createdBy: { $in: [...(req.user.friends || []), req.user._id] } },
      { tags: req.user._id },
    ]
  }

  private async getAccessiblePost(req: Request, postId: string) {
    const post = await this._postRepo.findOne({
      filter: {
        _id: new Types.ObjectId(postId),
        $or: [...this.postAvailability(req)],
      },
    })

    if (!post) {
      throw new appError('Post not found', 404)
    }

    return post
  }

  createComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.decoded?.sub
      if (!userId) {
        throw new appError('Unauthorized', 401)
      }

      const { content, postId }: CreateCommentDto = req.body
      await this.getAccessiblePost(req, postId)

      const comment = await this._commentRepo.create({
        content,
        postId: new Types.ObjectId(postId),
        createdBy: new Types.ObjectId(userId),
      })

      successResponse({
        res,
        statusCode: 201,
        message: 'Comment created successfully',
        data: comment,
      })
    } catch (error) {
      next(error)
    }
  }

  getCommentsByPost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const postId = String(req.params.postId)
      const { page, limit }: PostCommentsQuery = req.query as unknown as PostCommentsQuery

      await this.getAccessiblePost(req, postId)

      const comments = await this._commentRepo.paginate({
        ...(page !== undefined ? { page } : {}),
        ...(limit !== undefined ? { limit } : {}),
        search: {
          postId: new Types.ObjectId(postId),
        },
        sort: { createdAt: -1 },
      })

      successResponse({
        res,
        data: comments,
      })
    } catch (error) {
      next(error)
    }
  }

  getCommentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const comment = await this._commentRepo.findById(String(req.params.id))
      if (!comment) {
        throw new appError('Comment not found', 404)
      }

      await this.getAccessiblePost(req, comment.postId.toString())

      successResponse({
        res,
        data: comment,
      })
    } catch (error) {
      next(error)
    }
  }

  updateComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.decoded?.sub
      if (!userId) {
        throw new appError('Unauthorized', 401)
      }

      const id = String(req.params.id)
      const comment = await this._commentRepo.findById(id)
      if (!comment) {
        throw new appError('Comment not found', 404)
      }

      if (comment.createdBy.toString() !== userId) {
        throw new appError('You are not allowed to update this comment', 403)
      }

      const { content }: UpdateCommentDto = req.body
      const updatedComment = await this._commentRepo.update(id, { content })

      successResponse({
        res,
        message: 'Comment updated successfully',
        data: updatedComment,
      })
    } catch (error) {
      next(error)
    }
  }

  deleteComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.decoded?.sub
      if (!userId) {
        throw new appError('Unauthorized', 401)
      }

      const id = String(req.params.id)
      const comment = await this._commentRepo.findById(id)
      if (!comment) {
        throw new appError('Comment not found', 404)
      }

      if (comment.createdBy.toString() !== userId) {
        throw new appError('You are not allowed to delete this comment', 403)
      }

      await this._commentRepo.delete(id)

      successResponse({
        res,
        message: 'Comment deleted successfully',
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new CommentService()
