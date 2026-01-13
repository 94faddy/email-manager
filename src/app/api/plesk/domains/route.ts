// src/app/api/plesk/domains/route.ts
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import pleskClient from '@/lib/plesk'

// GET - ดึง domains ทั้งหมดจาก Plesk (ไม่รวม subdomain)
export async function GET() {
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

    // ดึง domains จาก Plesk
    const allDomains = await pleskClient.getDomains()
    
    // สร้าง list ของชื่อ domain ทั้งหมด
    const allDomainNames = allDomains.map(d => (d.name || d.ascii_name || '').toLowerCase())
    
    // กรองเอาเฉพาะ domain หลัก (ไม่รวม subdomain)
    // วิธีเช็ค: ถ้า domain A ลงท้ายด้วย ".domain B" แสดงว่า A เป็น subdomain ของ B
    const mainDomains = allDomains.filter(domain => {
      const name = (domain.name || domain.ascii_name || '').toLowerCase()
      
      // เช็คว่า domain นี้ไม่ใช่ subdomain ของ domain อื่นใน list
      for (const otherName of allDomainNames) {
        // ถ้าไม่ใช่ตัวเอง และ ลงท้ายด้วย .otherName
        if (name !== otherName && name.endsWith('.' + otherName)) {
          // แสดงว่าเป็น subdomain ของ otherName
          return false
        }
      }
      
      return true
    })

    // Map เป็น format ที่ต้องการ
    const domains = mainDomains.map(domain => ({
      id: domain.id,
      name: domain.name || domain.ascii_name,
      asciiName: domain.ascii_name,
      hostingType: domain.hosting_type
    }))

    return NextResponse.json({
      success: true,
      data: domains
    })

  } catch (error: any) {
    console.error('Get Plesk domains error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'ไม่สามารถดึงข้อมูลโดเมนได้' },
      { status: 500 }
    )
  }
}