// src/app/api/settings/domains/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - ดึง allowed domains ทั้งหมด
export async function GET() {
  try {
    const auth = await verifyAuth()
    
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    // ดึง allowed domains ที่ active
    const domains = await prisma.allowedDomain.findMany({
      where: { isActive: true },
      orderBy: { domainName: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: domains.map(d => d.domainName)
    })

  } catch (error: any) {
    console.error('Get allowed domains error:', error)
    return NextResponse.json(
      { success: false, message: 'ไม่สามารถดึงข้อมูลได้' },
      { status: 500 }
    )
  }
}

// POST - เพิ่ม allowed domain
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth()
    
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    // เฉพาะ ADMIN เท่านั้น
    if (auth.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      )
    }

    const { domainName } = await request.json()

    if (!domainName) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุชื่อโดเมน' },
        { status: 400 }
      )
    }

    // ตรวจสอบว่ามีอยู่แล้วหรือไม่
    const existing = await prisma.allowedDomain.findUnique({
      where: { domainName }
    })

    if (existing) {
      // ถ้ามีอยู่แล้วแต่ไม่ active ให้ active กลับมา
      if (!existing.isActive) {
        await prisma.allowedDomain.update({
          where: { domainName },
          data: { isActive: true }
        })
        return NextResponse.json({
          success: true,
          message: 'เปิดใช้งานโดเมนสำเร็จ'
        })
      }
      return NextResponse.json(
        { success: false, message: 'โดเมนนี้มีอยู่แล้ว' },
        { status: 400 }
      )
    }

    // สร้างใหม่
    await prisma.allowedDomain.create({
      data: { domainName }
    })

    return NextResponse.json({
      success: true,
      message: 'เพิ่มโดเมนสำเร็จ'
    })

  } catch (error: any) {
    console.error('Add allowed domain error:', error)
    return NextResponse.json(
      { success: false, message: 'ไม่สามารถเพิ่มโดเมนได้' },
      { status: 500 }
    )
  }
}

// DELETE - ลบ allowed domain
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAuth()
    
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    // เฉพาะ ADMIN เท่านั้น
    if (auth.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const domainName = searchParams.get('domain')

    if (!domainName) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุชื่อโดเมน' },
        { status: 400 }
      )
    }

    // Soft delete - set isActive = false
    await prisma.allowedDomain.update({
      where: { domainName },
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      message: 'ลบโดเมนสำเร็จ'
    })

  } catch (error: any) {
    console.error('Delete allowed domain error:', error)
    return NextResponse.json(
      { success: false, message: 'ไม่สามารถลบโดเมนได้' },
      { status: 500 }
    )
  }
}

// PUT - บันทึก allowed domains หลายตัวพร้อมกัน
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth()
    
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    // เฉพาะ ADMIN เท่านั้น
    if (auth.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      )
    }

    const { domains } = await request.json()

    if (!Array.isArray(domains)) {
      return NextResponse.json(
        { success: false, message: 'ข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Transaction: 
    // 1. Set all existing to inactive
    // 2. Upsert selected domains as active
    await prisma.$transaction(async (tx) => {
      // Deactivate all
      await tx.allowedDomain.updateMany({
        data: { isActive: false }
      })

      // Upsert each selected domain
      for (const domainName of domains) {
        await tx.allowedDomain.upsert({
          where: { domainName },
          create: { domainName, isActive: true },
          update: { isActive: true }
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'บันทึกสำเร็จ'
    })

  } catch (error: any) {
    console.error('Save allowed domains error:', error)
    return NextResponse.json(
      { success: false, message: 'ไม่สามารถบันทึกได้' },
      { status: 500 }
    )
  }
}