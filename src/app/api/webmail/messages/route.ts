// src/app/api/webmail/messages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getWebmailCredentials } from '@/lib/webmail-session'
import { getMessages } from '@/lib/mail-client'

// GET - Get messages in folder
export async function GET(request: NextRequest) {
  try {
    const credentials = await getWebmailCredentials()
    
    if (!credentials) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder') || 'INBOX'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || undefined

    const result = await getMessages(credentials, folder, { page, limit, search })

    return NextResponse.json({
      success: true,
      data: {
        messages: result.messages.map(msg => ({
          ...msg,
          date: msg.date.toISOString()
        })),
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit)
      }
    })

  } catch (error: any) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { success: false, message: 'ไม่สามารถดึงข้อมูลได้' },
      { status: 500 }
    )
  }
}
