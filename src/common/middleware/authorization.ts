import { NextFunction, Request, Response } from 'express'
import { RoleEnum } from '../enum/user.enum'
import { appError } from '../utils/global-error-handlier'

export const authorization = (...roles: RoleEnum[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.decoded) {
      return next(new appError('Unauthorized', 401))
    }

    if (!roles.includes(req.decoded.role as RoleEnum)) {
      return next(new appError('Forbidden', 403))
    }

    next()
  }
}

export const graphql_authorization = async (roles: RoleEnum[], role?: string) => {
  if (!role) {
    throw new appError('Unauthorized', 401)
  }

  if (!roles.includes(role as RoleEnum)) {
    throw new appError('Forbidden', 403)
  }
}
