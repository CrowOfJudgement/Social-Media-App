import { NextFunction, Request, Response } from 'express'
import redisService from '../../common/service/redis.service'
import userRepository from '../../DB/repositories/user.repository'
import { appError } from '../../common/utils/global-error-handlier'
import { successResponse } from '../../common/utils/response.sucsess'
import { GetUsersQuery, UpdateProfile } from './user.validation'

class UserService {
  private readonly _userModel = new userRepository()

  private sanitizeUser(user: any) {
    const userObject = typeof user.toObject === 'function' ? user.toObject() : user
    const { password: _password, ...safeUser } = userObject
    return safeUser
  }

  profile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.decoded?.sub
      if (!userId) {
        throw new appError('Unauthorized', 401)
      }

      const user = await this._userModel.findById(userId)
      if (!user) {
        throw new appError('User not found', 404)
      }

      res.status(200).json({ user: this.sanitizeUser(user) })
    } catch (error) {
      next(error)
    }
  }

  getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search }: GetUsersQuery = req.query as unknown as GetUsersQuery

      const users = await this._userModel.paginate({
        ...(page !== undefined ? { page } : {}),
        ...(limit !== undefined ? { limit } : {}),
        search: search
          ? {
              $or: [
                { userName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
              ],
            }
          : {},
      })

      successResponse({
        res,
        data: {
          ...users,
          data: users.data.map(user => this.sanitizeUser(user)),
        },
      })
    } catch (error) {
      next(error)
    }
  }

  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this._userModel.findById(String(req.params.id))
      if (!user) {
        throw new appError('User not found', 404)
      }

      successResponse({
        res,
        data: this.sanitizeUser(user),
      })
    } catch (error) {
      next(error)
    }
  }

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.decoded?.sub
      if (!userId) {
        throw new appError('Unauthorized', 401)
      }

      const payload: UpdateProfile = req.body
      const updateData = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined),
      )
      const updatedUser = await this._userModel.update(userId, updateData)

      if (!updatedUser) {
        throw new appError('User not found', 404)
      }

      successResponse({
        res,
        message: 'Profile updated successfully',
        data: this.sanitizeUser(updatedUser),
      })
    } catch (error) {
      next(error)
    }
  }

  deleteProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.decoded?.sub
      if (!userId) {
        throw new appError('Unauthorized', 401)
      }

      const deletedUser = await this._userModel.delete(userId)

      if (!deletedUser) {
        throw new appError('User not found', 404)
      }

      await redisService.removeFCMUser(userId)

      successResponse({
        res,
        message: 'Profile deleted successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  adminOnly = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ message: 'Admin authorized successfully' })
    } catch (error) {
      next(error)
    }
  }
}

const userService = new UserService()

export default userService
