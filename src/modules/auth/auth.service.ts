import { NextFunction, Request, Response } from 'express'
import { HydratedDocument } from 'mongoose'
import { appError } from '../../common/utils/global-error-handlier'
import { compareHash } from '../../common/utils/security/hash'
import { IUser } from '../../DB/models/user.model'
import userRepository from '../../DB/repositories/user.repository'
import { SignIn, SignUp } from './auth.validation'

type SignupRequestBody = SignUp
type SigninRequestBody = SignIn

class AuthService {
  private readonly _userModel = new userRepository()

  constructor() {}

  signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userName, email, password, cPassword, phone, address, age, gender }: SignupRequestBody =
        req.body

      await this._userModel.isEmailExists(email)

      const user: HydratedDocument<IUser> = await this._userModel.create({
        userName,
        email,
        password,
        phone,
        address,
        age,
        gender,
      } as Partial<IUser>)

      const userObject = user.toObject()
      const { password: _password, ...safeUser } = userObject

      res.status(200).json({ message: 'Signup successful', user: safeUser })
    } catch (error) {
      next(error)
    }
  }

  signin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password }: SigninRequestBody = req.body

      const user = await this._userModel.findOne({
        filter: { email },
        projection: '+password',
      })
      if (!user) {
        throw new appError('Invalid credentials', 401)
      }

      const match = await compareHash(password, user.password)
      if (!match) {
        throw new appError('Invalid credentials', 401)
      }

      const userObject = user.toObject()
      const { password: _password, ...safeUser } = userObject

      res.status(200).json({ message: 'Signin successful', user: safeUser })
    } catch (error) {
      next(error)
    }
  }
}

const authService = new AuthService()

export default authService
