import { NextFunction, Request, Response } from 'express'
import { Types } from 'mongoose'
import { AvailabilityEnum } from '../../common/enum/user.enum'
import { appError } from '../../common/utils/global-error-handlier'
import { successResponse } from '../../common/utils/response.sucsess'
import PostRepository from '../../DB/repositories/post.repository'
import type { CreatePostDto, UpdatePostDto } from './post.dto'

class PostService {
  private readonly _postRepo = new PostRepository()

  constructor() {}

  private PostAvailability(req: Request) {
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

  private async getAccessiblePostById(req: Request, postId: string) {
    const post = await this._postRepo.findOne({
      filter: {
        _id: new Types.ObjectId(postId),
        $or: [...this.PostAvailability(req)],
      },
    })

    if (!post) {
      throw new appError('Post not found', 404)
    }

    return post
  }

  createPost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.decoded?.sub
      if (!userId) {
        throw new appError('Unauthorized', 401)
      }

      const { content, availability = AvailabilityEnum.Public, tags = [] }: CreatePostDto = req.body

      const post = await this._postRepo.create({
        content,
        availability,
        tags: tags.map((tag) => new Types.ObjectId(tag)),
        createdBy: new Types.ObjectId(userId),
      })

      res.status(201).json({
        message: 'Post created successfully',
        post,
      })
    } catch (error) {
      next(error)
    }
  }

  getPosts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const searchQuery = req.query?.search
        ? { content: { $regex: String(req.query.search), $options: 'i' } }
        : {}

      const posts = await this._postRepo.paginate({
        page: Number(req.query?.page),
        limit: Number(req.query?.limit),
        search: {
          $or: [...this.PostAvailability(req)],
          ...searchQuery,
        },
      })

      successResponse({ res, data: posts })
    } catch (error) {
      next(error)
    }
  }

  getPostById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id)
      const post = await this.getAccessiblePostById(req, id)

      successResponse({ res, data: post })
    } catch (error) {
      next(error)
    }
  }

  updatePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.decoded?.sub
      if (!userId) {
        throw new appError('Unauthorized', 401)
      }

      const id = String(req.params.id)
      const existingPost = await this._postRepo.findById(id)

      if (!existingPost) {
        throw new appError('Post not found', 404)
      }

      if (existingPost.createdBy.toString() !== userId) {
        throw new appError('You are not allowed to update this post', 403)
      }

      const { content, availability, tags }: UpdatePostDto = req.body
      const updatedPost = await this._postRepo.update(id, {
        ...(content !== undefined ? { content } : {}),
        ...(availability !== undefined ? { availability } : {}),
        ...(tags !== undefined ? { tags: tags.map(tag => new Types.ObjectId(tag)) } : {}),
      })

      successResponse({
        res,
        message: 'Post updated successfully',
        data: updatedPost,
      })
    } catch (error) {
      next(error)
    }
  }

  deletePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.decoded?.sub
      if (!userId) {
        throw new appError('Unauthorized', 401)
      }

      const id = String(req.params.id)
      const existingPost = await this._postRepo.findById(id)

      if (!existingPost) {
        throw new appError('Post not found', 404)
      }

      if (existingPost.createdBy.toString() !== userId) {
        throw new appError('You are not allowed to delete this post', 403)
      }

      await this._postRepo.delete(id)

      successResponse({
        res,
        message: 'Post deleted successfully',
      })
    } catch (error) {
      next(error)
    }
  }
}



export default new PostService()
