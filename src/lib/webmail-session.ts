// src/lib/webmail-session.ts
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const WEBMAIL_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'webmail-secret-key'
)

export interface WebmailSession {
  email: string
  password: string // Encrypted
  loginAt: number
}

/**
 * Create webmail session token
 */
export async function createWebmailSession(email: string, password: string): Promise<string> {
  const token = await new SignJWT({ 
    email, 
    password: Buffer.from(password).toString('base64'),
    loginAt: Date.now()
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(WEBMAIL_SECRET)
  
  return token
}

/**
 * Verify and get webmail session
 */
export async function getWebmailSession(): Promise<WebmailSession | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('webmail_session')?.value
    
    if (!token) return null
    
    const { payload } = await jwtVerify(token, WEBMAIL_SECRET)
    
    return {
      email: payload.email as string,
      password: Buffer.from(payload.password as string, 'base64').toString('utf8'),
      loginAt: payload.loginAt as number
    }
  } catch {
    return null
  }
}

/**
 * Get credentials from session
 */
export async function getWebmailCredentials() {
  const session = await getWebmailSession()
  
  if (!session) return null
  
  return {
    email: session.email,
    password: session.password
  }
}
