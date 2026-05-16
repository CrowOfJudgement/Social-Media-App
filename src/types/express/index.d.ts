import 'express'
import { HydratedDocument, Types } from 'mongoose'
import { Multer } from 'multer'
import { IUser } from '../../DB/models/user.model'

declare global {
  namespace Express {
    interface Request {
      decoded?: {
        sub: string
        email: string
        role: string
        provider: string
        jti?: string
        iat?: number
        exp?: number
        [key: string]: unknown
      }
      user?: HydratedDocument<IUser> & {
        _id: Types.ObjectId
        friends?: Types.ObjectId[]
      }
      file?: Multer.File
      files?: Multer.File[] | { [fieldname: string]: Multer.File[] }
    }
  }
}

export {}
