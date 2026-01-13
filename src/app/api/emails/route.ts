// src/app/api/emails/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import pleskClient from '@/lib/plesk'
import { encryptPassword } from '@/lib/crypto'

// GET - ดึงรายการอีเมล์ของ user
export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const isAdmin = user.role === 'ADMIN'

    const emails = await prisma.emailAccount.findMany({
      where: isAdmin ? {} : { userId: user.userId },
      include: {
        website: {
          select: { domainName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // แปลงข้อมูลให้ใช้งานง่าย
    const formattedEmails = emails.map(email => ({
      id: email.id,
      email: email.emailAddress,
      mailName: email.mailName,
      domain: email.domainName,
      isActive: email.isActive,
      hasMailbox: email.hasMailbox,
      quotaMb: email.quotaMb,
      description: email.description,
      hasPassword: !!email.encryptedPassword, // บอกว่ามี password เก็บไว้หรือไม่
      createdAt: email.createdAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: formattedEmails
    })

  } catch (error) {
    console.error('Get emails error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}

// POST - สร้างอีเมล์ใหม่
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { mailName, domainName, websiteId, password, description } = body

    console.log('Create email request:', { mailName, domainName, websiteId, hasPassword: !!password })

    // ต้องมี mailName
    if (!mailName) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกชื่ออีเมล์' },
        { status: 400 }
      )
    }

    // ต้องมี password
    if (!password) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกรหัสผ่าน' },
        { status: 400 }
      )
    }

    // Validate mailName format
    if (!/^[a-zA-Z0-9._-]+$/.test(mailName)) {
      return NextResponse.json(
        { success: false, message: 'ชื่ออีเมล์ไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' },
        { status: 400 }
      )
    }

    let finalDomainName = ''
    let websiteIdToUse = null

    // ถ้าส่ง domainName มาตรง (แบบใหม่)
    if (domainName) {
      // ตรวจสอบว่า domain อยู่ใน allowed list หรือไม่
      const allowedDomain = await prisma.allowedDomain.findUnique({
        where: { domainName }
      })

      console.log('Checking domain:', domainName, 'Found:', allowedDomain)

      // ถ้าไม่มีใน allowed list และไม่ใช่ ADMIN
      if (!allowedDomain?.isActive && user.role !== 'ADMIN') {
        return NextResponse.json(
          { success: false, message: `โดเมน ${domainName} ไม่ได้รับอนุญาต กรุณาเพิ่มใน Settings > โดเมน` },
          { status: 403 }
        )
      }

      finalDomainName = domainName

      // หา websiteId จาก domainName (ถ้ามี)
      const website = await prisma.website.findUnique({
        where: { domainName }
      })
      websiteIdToUse = website?.id || null
    }
    // ถ้าส่ง websiteId มา (แบบเก่า)
    else if (websiteId) {
      const website = await prisma.website.findUnique({
        where: { id: websiteId }
      })

      if (!website) {
        return NextResponse.json(
          { success: false, message: 'ไม่พบเว็บไซต์ที่เลือก' },
          { status: 404 }
        )
      }

      finalDomainName = website.domainName
      websiteIdToUse = website.id
    }
    else {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุโดเมน' },
        { status: 400 }
      )
    }

    const emailAddress = `${mailName.toLowerCase()}@${finalDomainName}`

    // ตรวจสอบว่าอีเมล์ซ้ำหรือไม่
    const existing = await prisma.emailAccount.findUnique({
      where: { emailAddress }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'อีเมล์นี้มีอยู่ในระบบแล้ว' },
        { status: 400 }
      )
    }

    // สร้างอีเมล์บน Plesk
    await pleskClient.createMailAccount(emailAddress, password, {
      mailbox: true
    })

    // Encrypt password สำหรับเก็บในฐานข้อมูล
    const encryptedPwd = encryptPassword(password)

    // บันทึกลงฐานข้อมูล
    const newEmail = await prisma.emailAccount.create({
      data: {
        emailAddress,
        mailName: mailName.toLowerCase(),
        domainName: finalDomainName,
        userId: user.userId,
        websiteId: websiteIdToUse,
        hasMailbox: true,
        description: description || null,
        encryptedPassword: encryptedPwd
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.userId,
        action: 'CREATE_EMAIL',
        details: `สร้างอีเมล์ใหม่: ${emailAddress}`
      }
    })

    return NextResponse.json({
      success: true,
      message: 'สร้างอีเมล์สำเร็จ',
      data: {
        id: newEmail.id,
        email: emailAddress
      }
    })

  } catch (error: any) {
    console.error('Create email error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'ไม่สามารถสร้างอีเมล์ได้' },
      { status: 500 }
    )
  }
}

// DELETE - ลบอีเมล์
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุอีเมล์' },
        { status: 400 }
      )
    }

    // ตรวจสอบสิทธิ์
    const emailAccount = await prisma.emailAccount.findUnique({
      where: { emailAddress: email }
    })

    if (!emailAccount) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบอีเมล์นี้' },
        { status: 404 }
      )
    }

    if (user.role !== 'ADMIN' && emailAccount.userId !== user.userId) {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์ลบอีเมล์นี้' },
        { status: 403 }
      )
    }

    // ลบจาก Plesk
    await pleskClient.deleteMailAccount(email)

    // ลบจากฐานข้อมูล
    await prisma.emailAccount.delete({
      where: { emailAddress: email }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.userId,
        action: 'DELETE_EMAIL',
        details: `ลบอีเมล์: ${email}`
      }
    })

    return NextResponse.json({
      success: true,
      message: 'ลบอีเมล์สำเร็จ'
    })

  } catch (error: any) {
    console.error('Delete email error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'ไม่สามารถลบอีเมล์ได้' },
      { status: 500 }
    )
  }
}