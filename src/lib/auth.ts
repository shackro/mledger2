import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export const generateToken = (userId: string, phone: string) => {
  return jwt.sign({ userId, phone }, JWT_SECRET, { expiresIn: '24h' })
}

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export const hashPin = async (pin: string) => {
  return bcrypt.hash(pin, 10)
}

export const verifyPin = async (pin: string, hash: string) => {
  return bcrypt.compare(pin, hash)
}
