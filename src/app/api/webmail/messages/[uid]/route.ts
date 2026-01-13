// src/app/api/webmail/messages/[uid]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getWebmailCredentials } from '@/lib/webmail-session'
import { getMessage, deleteMessage, setMessageRead, setMessageStarred, moveMessage } from '@/lib/mail-client'

// GET - Get single message detail
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
    const uid = parseInt(params.uid)

    const message = await getMessage(credentials, folder, uid)

    if (!message) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบอีเมล์' },
        { status: 404 }
      )
    }

    // Convert attachments to base64 for transfer (without content for list)
    const attachments = message.attachments.map(att => ({
      filename: att.filename,
      contentType: att.contentType,
      size: att.size,
      contentId: att.contentId,
      hasContent: !!att.content
    }))

    return NextResponse.json({
      success: true,
      data: {
        ...message,
        date: message.date.toISOString(),
        attachments
      }
    })

  } catch (error: any) {
    console.error('Get message error:', error)
    return NextResponse.json(
      { success: false, message: 'ไม่สามารถดึงข้อมูลได้' },
      { status: 500 }
    )
  }
}

// DELETE - Delete message
export async function DELETE(
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
    const permanent = searchParams.get('permanent') === 'true'
    const uid = parseInt(params.uid)

    await deleteMessage(credentials, folder, uid, permanent)

    return NextResponse.json({
      success: true,
      message: 'ลบอีเมล์สำเร็จ'
    })

  } catch (error: any) {
    console.error('Delete message error:', error)
    return NextResponse.json(
      { success: false, message: 'ไม่สามารถลบได้' },
      { status: 500 }
    )
  }
}

// PUT - Update message (mark read, star, move)
export async function PUT(
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
    const uid = parseInt(params.uid)
    
    const body = await request.json()
    const { action, value, targetFolder } = body

    switch (action) {
      case 'read':
        await setMessageRead(credentials, folder, uid, value)
        break
      case 'star':
        await setMessageStarred(credentials, folder, uid, value)
        break
      case 'move':
        if (!targetFolder) {
          return NextResponse.json(
            { success: false, message: 'กรุณาระบุโฟลเดอร์ปลายทาง' },
            { status: 400 }
          )
        }
        await moveMessage(credentials, folder, uid, targetFolder)
        break
      default:
        return NextResponse.json(
          { success: false, message: 'ไม่รู้จัก action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: 'อัปเดตสำเร็จ'
    })

  } catch (error: any) {
    console.error('Update message error:', error)
    return NextResponse.json(
      { success: false, message: 'ไม่สามารถอัปเดตได้' },
      { status: 500 }
    )
  }
}
