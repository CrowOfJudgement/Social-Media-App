import { NextFunction, Request, Response } from 'express'
import userRepository from '../../DB/repositories/user.repository'
import { appError } from '../../common/utils/global-error-handlier'

class UserService {
  private readonly _userModel = new userRepository()

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

      res.status(200).json({ user })
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
