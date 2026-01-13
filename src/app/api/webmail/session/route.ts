// src/app/api/webmail/session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getWebmailSession } from '@/lib/webmail-session'

// GET - Get current webmail session
export async function GET() {
  try {
    const session = await getWebmailSession()
    
    if (!session) {
      return NextResponse.json({
        success: true,
        data: null
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        email: session.email,
        loginAt: session.loginAt
      }
    })

  } catch (error: any) {
    console.error('Get session error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
