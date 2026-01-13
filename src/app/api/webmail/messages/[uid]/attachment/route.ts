// src/app/api/webmail/messages/[uid]/attachment/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getWebmailCredentials } from '@/lib/webmail-session'
import { getMessage } from '@/lib/mail-client'

// GET - Download attachment
export async function GET(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
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
    const filename = searchParams.get('filename')
    const uid = parseInt(params.uid)

    if (!filename) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุชื่อไฟล์' },
        { status: 400 }
      )
    }

    const message = await getMessage(credentials, folder, uid)

    if (!message) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบอีเมล์' },
        { status: 404 }
      )
    }

    const attachment = message.attachments.find(att => att.filename === filename)

    if (!attachment || !attachment.content) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบไฟล์แนบ' },
        { status: 404 }
      )
    }

    return new NextResponse(attachment.content, {
      headers: {
        'Content-Type': attachment.contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.filename)}"`,
        'Content-Length': attachment.size.toString()
      }
    })

  } catch (error: any) {
    console.error('Download attachment error:', error)
    return NextResponse.json(
      { success: false, message: 'ไม่สามารถดาวน์โหลดได้' },
      { status: 500 }
    )
  }
}
