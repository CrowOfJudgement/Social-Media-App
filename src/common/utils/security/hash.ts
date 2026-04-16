import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

export const generateHash = async (value: string): Promise<string> => {
  return bcrypt.hash(value, SALT_ROUNDS)
}

export const compareHash = async (value: string, hashedValue: string): Promise<boolean> => {
  return bcrypt.compare(value, hashedValue)
}

