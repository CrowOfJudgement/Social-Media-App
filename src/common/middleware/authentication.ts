import { NextFunction, Request, Response } from 'express'
import { appError } from '../utils/global-error-handlier'
import { verifyToken } from '../utils/security/token'
import redisService from '../service/redis.service'

export const authentication = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authorization = req.headers.authorization
    if (!authorization?.startsWith('Bearer ')) {
      throw new appError('Authorization token is required', 401)
    }

    const token = authorization.slice(7)
    const decoded = verifyToken(token)

    if (!decoded.jti || !decoded.sub) {
      throw new appError('Invalid token payload', 401)
    }

    const revokedTokenKey = `revoked_token:${decoded.jti}`
    const isRevoked = await redisService.isExist(revokedTokenKey)
    if (isRevoked) {
      throw new appError('Token has been revoked', 401)
    }

    req.decoded = decoded
    next()
  } catch (error) {
    next(error)
  }
}
