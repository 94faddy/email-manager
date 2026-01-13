// src/app/api/webmail/drafts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getWebmailCredentials } from '@/lib/webmail-session'
import { saveDraft } from '@/lib/mail-client'

// POST - Save draft
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
    
    const to = formData.get('to') as string || ''
    const cc = formData.get('cc') as string | null
    const bcc = formData.get('bcc') as string | null
    const subject = formData.get('subject') as string || '(ไม่มีหัวข้อ)'
    const text = formData.get('text') as string | null

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

    const result = await saveDraft(credentials, {
      to: to ? to.split(',').map(e => e.trim()) : [],
      cc: cc ? cc.split(',').map(e => e.trim()) : undefined,
      bcc: bcc ? bcc.split(',').map(e => e.trim()) : undefined,
      subject,
      text: text || undefined,
      attachments: attachments.length > 0 ? attachments : undefined
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'บันทึกฉบับร่างสำเร็จ'
      })
    } else {
      return NextResponse.json(
        { success: false, message: result.error || 'บันทึกฉบับร่างไม่สำเร็จ' },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Save draft error:', error)
    return NextResponse.json(
      { success: false, message: 'ไม่สามารถบันทึกฉบับร่างได้' },
      { status: 500 }
    )
  }
}