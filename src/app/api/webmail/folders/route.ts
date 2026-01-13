// src/app/api/webmail/folders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getWebmailCredentials } from '@/lib/webmail-session'
import { getMailFolders, getFolderStatus } from '@/lib/mail-client'

// GET - Get all folders with message counts
export async function GET() {
  try {
    const credentials = await getWebmailCredentials()
    
    if (!credentials) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    const folders = await getMailFolders(credentials)
    
    // Get message counts for each folder
    const foldersWithCounts = await Promise.all(
      folders.map(async (folder) => {
        try {
          const status = await getFolderStatus(credentials, folder.path)
          return {
            ...folder,
            messages: status
          }
        } catch {
          return {
            ...folder,
            messages: { total: 0, unseen: 0 }
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: foldersWithCounts
    })

  } catch (error: any) {
    console.error('Get folders error:', error)
    return NextResponse.json(
      { success: false, message: 'ไม่สามารถดึงข้อมูลโฟลเดอร์ได้' },
      { status: 500 }
    )
  }
}

// POST - Create new folder
export async function POST(request: NextRequest) {
  try {
    const credentials = await getWebmailCredentials()
    
    if (!credentials) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    const { name } = await request.json()
    
    if (!name) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุชื่อโฟลเดอร์' },
        { status: 400 }
      )
    }

    const { createFolder } = await import('@/lib/mail-client')
    await createFolder(credentials, name)

    return NextResponse.json({
      success: true,
      message: 'สร้างโฟลเดอร์สำเร็จ'
    })

  } catch (error: any) {
    console.error('Create folder error:', error)
    return NextResponse.json(
      { success: false, message: 'ไม่สามารถสร้างโฟลเดอร์ได้' },
      { status: 500 }
    )
  }
}

// DELETE - Delete folder
export async function DELETE(request: NextRequest) {
  try {
    const credentials = await getWebmailCredentials()
    
    if (!credentials) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    
    if (!name) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุชื่อโฟลเดอร์' },
        { status: 400 }
      )
    }

    const { deleteFolder } = await import('@/lib/mail-client')
    await deleteFolder(credentials, name)

    return NextResponse.json({
      success: true,
      message: 'ลบโฟลเดอร์สำเร็จ'
    })

  } catch (error: any) {
    console.error('Delete folder error:', error)
    return NextResponse.json(
      { success: false, message: 'ไม่สามารถลบโฟลเดอร์ได้' },
      { status: 500 }
    )
  }
}
