// src/app/api/webmail/send/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getWebmailCredentials } from '@/lib/webmail-session'
import { sendMailAndSave } from '@/lib/mail-client'

// POST - Send email
export async function POST(request: NextRequest) {
  try {
    const credentials = await getWebmailCredentials()
    
    if (!credentials) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    
    const to = formData.get('to') as string
    const cc = formData.get('cc') as string | null
    const bcc = formData.get('bcc') as string | null
    const subject = formData.get('subject') as string
    const text = formData.get('text') as string | null
    const html = formData.get('html') as string | null
    const inReplyTo = formData.get('inReplyTo') as string | null
    const references = formData.get('references') as string | null

    if (!to) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุผู้รับ' },
        { status: 400 }
      )
    }

    if (!subject) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุหัวข้อ' },
        { status: 400 }
      )
    }

    // Handle attachments
    const attachments: { filename: string; content: Buffer; contentType: string }[] = []
    const files = formData.getAll('attachments') as File[]
    
    for (const file of files) {
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer())
        attachments.push({
          filename: file.name,
          content: buffer,
          contentType: file.type || 'application/octet-stream'
        })
      }
    }

    const result = await sendMailAndSave(credentials, {
      to: to.split(',').map(e => e.trim()),
      cc: cc ? cc.split(',').map(e => e.trim()) : undefined,
      bcc: bcc ? bcc.split(',').map(e => e.trim()) : undefined,
      subject,
      text: text || undefined,
      html: html || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      inReplyTo: inReplyTo || undefined,
      references: references || undefined
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'ส่งอีเมล์สำเร็จ',
        data: { messageId: result.messageId }
      })
    } else {
      return NextResponse.json(
        { success: false, message: result.error || 'ส่งอีเมล์ไม่สำเร็จ' },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Send email error:', error)
    return NextResponse.json(
      { success: false, message: 'ไม่สามารถส่งอีเมล์ได้' },
      { status: 500 }
    )
  }
}