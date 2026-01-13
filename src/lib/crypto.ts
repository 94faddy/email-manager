// src/lib/crypto.ts
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.JWT_SECRET || 'default-secret-key-32-chars-long!'
const IV_LENGTH = 16
const ALGORITHM = 'aes-256-cbc'

// สร้าง key 32 bytes จาก secret
function getKey(): Buffer {
  return crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
}

/**
 * Encrypt password
 */
export function encryptPassword(password: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  
  let encrypted = cipher.update(password, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  return iv.toString('hex') + ':' + encrypted
}

/**
 * Decrypt password
 */
export function decryptPassword(encryptedPassword: string): string {
  const [ivHex, encrypted] = encryptedPassword.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}