import { HydratedDocument, Model, QueryFilter } from 'mongoose'
import { skip } from 'node:test'
import UserModel, { IUser } from '../models/user.model'
import BaseRepository from './base.repository'
import { appError } from '../../common/utils/global-error-handlier'

class userRepository extends BaseRepository<IUser> {
  constructor(protected readonly model: Model<IUser>=UserModel) {
    super(model)
  }


  async isEmailExists(email: string): Promise<boolean> {
    const existing = await UserModel.findOne({ email }).lean()
    if (existing) {
      throw new appError('User with this email already exists', 400)
    }
    return false
  }
}

export default userRepository

