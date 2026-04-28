import crypto from 'crypto'
import { ENCRYPTION_KEY } from '../../../confing/config.service'

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY is not configured')
}

const encryptionKeyBuffer = crypto
  .createHash('sha256')
  .update(ENCRYPTION_KEY)
  .digest()

const IV_LENGTH = 16

export const encrypt = (value: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv)
  const encryptedValue = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])

  return `${iv.toString('hex')}:${encryptedValue.toString('hex')}`
}

export const decrypt = (value: string): string => {
  const [ivHex, encryptedHex] = value.split(':')

  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid encrypted value')
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    encryptionKeyBuffer,
    Buffer.from(ivHex, 'hex'),
  )

  const decryptedValue = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ])

  return decryptedValue.toString('utf8')
}
