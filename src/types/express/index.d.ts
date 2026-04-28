import 'express'

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
    }
  }
}

export {}
