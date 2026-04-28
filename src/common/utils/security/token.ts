import { createHmac, randomUUID } from 'node:crypto'
import { JWT_EXPIRES_IN, JWT_SECRET } from '../../../confing/config.service'

type TokenPayload = Record<string, unknown> & {
  sub: string
  email: string
  role: string
  provider: string
  jti?: string
  iat?: number
  exp?: number
}

type SignTokenOptions = {
  expiresIn?: string
  jti?: string
}

const base64UrlEncode = (value: string) => Buffer.from(value).toString('base64url')

const base64UrlDecode = (value: string) => Buffer.from(value, 'base64url').toString('utf8')

const parseExpiresIn = (value: string) => {
  const match = value.match(/^(\d+)([smhd])$/)
  if (!match) return 60 * 60 * 24

  const amount = Number(match[1])
  const unit = match[2]
  switch (unit) {
    case 's':
      return amount
    case 'm':
      return amount * 60
    case 'h':
      return amount * 60 * 60
    case 'd':
      return amount * 60 * 60 * 24
    default:
      return 60 * 60 * 24
  }
}

export const signToken = (payload: TokenPayload, options: SignTokenOptions = {}) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured')
  }

  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const expiresIn = options.expiresIn || JWT_EXPIRES_IN
  const jti = options.jti || randomUUID()

  const fullPayload: TokenPayload = {
    ...payload,
    jti,
    iat: now,
    exp: now + parseExpiresIn(expiresIn),
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload))
  const signature = createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url')

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

export const verifyToken = (token: string): TokenPayload => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured')
  }

  const [encodedHeader, encodedPayload, signature] = token.split('.')
  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error('Invalid token format')
  }

  const expectedSignature = createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url')

  if (signature !== expectedSignature) {
    throw new Error('Invalid token signature')
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as TokenPayload
  const now = Math.floor(Date.now() / 1000)

  if (!payload.exp || payload.exp < now) {
    throw new Error('Token expired')
  }

  return payload
}
