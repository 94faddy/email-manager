// src/lib/plesk.ts
import axios, { AxiosInstance } from 'axios'
import { PleskDomain, PleskApiResponse } from '@/types'

/**
 * Plesk REST API Client
 */

class PleskClient {
  private client: AxiosInstance
  private host: string

  constructor() {
    this.host = process.env.PLESK_HOST || ''
    
    this.client = axios.create({
      baseURL: `${this.host}/api/v2`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false,
      }),
      timeout: 30000,
    })

    if (process.env.PLESK_API_KEY) {
      this.client.defaults.headers.common['X-API-Key'] = process.env.PLESK_API_KEY
    } else if (process.env.PLESK_ADMIN_USER && process.env.PLESK_ADMIN_PASSWORD) {
      const credentials = Buffer.from(
        `${process.env.PLESK_ADMIN_USER}:${process.env.PLESK_ADMIN_PASSWORD}`
      ).toString('base64')
      this.client.defaults.headers.common['Authorization'] = `Basic ${credentials}`
    }
  }

  /**
   * ดึงรายการ Domains ทั้งหมดจาก Plesk
   */
  async getDomains(): Promise<PleskDomain[]> {
    try {
      const response = await this.client.get('/domains')
      return response.data
    } catch (error: any) {
      console.error('Failed to get domains:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'Failed to fetch domains from Plesk')
    }
  }

  /**
   * ดึงข้อมูล Domain เฉพาะ
   */
  async getDomain(domainId: number): Promise<PleskDomain> {
    try {
      const response = await this.client.get(`/domains/${domainId}`)
      return response.data
    } catch (error: any) {
      console.error('Failed to get domain:', error.response?.data || error.message)
      throw new Error(error.response?.data?.message || 'Failed to fetch domain from Plesk')
    }
  }

  /**
   * ดึงรายการ Email ของ Domain
   */
  async getMailAccounts(domainName: string): Promise<string[]> {
    try {
      const response = await this.client.post('/cli/mail/call', {
        params: ['--list', '-domain', domainName]
      })
      
      console.log(`Mail list for ${domainName}:`, response.data)
      
      if (response.data.code === 0 && response.data.stdout) {
        const lines = response.data.stdout.split('\n')
        const emails: string[] = []
        
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          
          // ถ้ามี @ อยู่แล้ว
          if (trimmed.includes('@')) {
            emails.push(trimmed)
          } else {
            // ถ้าเป็นแค่ชื่อ user ให้เติม @domain
            emails.push(`${trimmed}@${domainName}`)
          }
        }
        
        console.log(`Parsed emails:`, emails)
        return emails
      }
      
      return []
    } catch (error: any) {
      console.error('Failed to get mail accounts:', error.response?.data || error.message)
      return []
    }
  }

  /**
   * สร้าง Email Account ใหม่
   * 
   * @param email - Email address เต็ม เช่น user@domain.com
   * @param password - รหัสผ่าน
   * @param options - ตัวเลือกเพิ่มเติม
   */
  async createMailAccount(
    email: string,
    password: string,
    options: {
      mailbox?: boolean
    } = {}
  ): Promise<PleskApiResponse> {
    const { mailbox = true } = options

    try {
      const params = ['--create', email, '-passwd', password]
      
      if (mailbox) {
        params.push('-mailbox', 'true')
      }
      
      // ไม่ต้องส่ง -mbox_quota จะใช้ default ของ Plesk (Unlimited)

      const response = await this.client.post('/cli/mail/call', { params })
      
      if (response.data.code !== 0) {
        throw new Error(response.data.stderr || 'Failed to create email')
      }

      return {
        code: 0,
        stdout: response.data.stdout,
        data: { email }
      }
    } catch (error: any) {
      console.error('Failed to create mail account:', error.response?.data || error.message)
      
      const errorMsg = error.response?.data?.stderr || error.message
      
      if (errorMsg.includes('already exists')) {
        throw new Error('อีเมล์นี้มีอยู่ในระบบแล้ว')
      } else if (errorMsg.includes('password')) {
        throw new Error('รหัสผ่านไม่ผ่านเงื่อนไข กรุณาใช้รหัสผ่านที่แข็งแรงกว่านี้')
      }
      
      throw new Error(errorMsg || 'ไม่สามารถสร้างอีเมล์ได้')
    }
  }

  /**
   * ลบ Email Account
   */
  async deleteMailAccount(email: string): Promise<PleskApiResponse> {
    try {
      const response = await this.client.post('/cli/mail/call', {
        params: ['--remove', email]
      })
      
      if (response.data.code !== 0) {
        throw new Error(response.data.stderr || 'Failed to delete email')
      }

      return {
        code: 0,
        stdout: response.data.stdout
      }
    } catch (error: any) {
      console.error('Failed to delete mail account:', error.response?.data || error.message)
      throw new Error(error.response?.data?.stderr || 'ไม่สามารถลบอีเมล์ได้')
    }
  }

  /**
   * เปลี่ยนรหัสผ่าน Email
   */
  async changeMailPassword(email: string, newPassword: string): Promise<PleskApiResponse> {
    try {
      const response = await this.client.post('/cli/mail/call', {
        params: ['--update', email, '-passwd', newPassword]
      })
      
      if (response.data.code !== 0) {
        throw new Error(response.data.stderr || 'Failed to change password')
      }

      return {
        code: 0,
        stdout: response.data.stdout
      }
    } catch (error: any) {
      console.error('Failed to change password:', error.response?.data || error.message)
      throw new Error(error.response?.data?.stderr || 'ไม่สามารถเปลี่ยนรหัสผ่านได้')
    }
  }

  /**
   * ดึงข้อมูล Email Account
   */
  async getMailAccountInfo(email: string): Promise<PleskApiResponse<any>> {
    try {
      const response = await this.client.post('/cli/mail/call', {
        params: ['--info', email]
      })
      
      return {
        code: response.data.code,
        stdout: response.data.stdout,
        stderr: response.data.stderr
      }
    } catch (error: any) {
      console.error('Failed to get mail info:', error.response?.data || error.message)
      throw new Error('ไม่สามารถดึงข้อมูลอีเมล์ได้')
    }
  }

  /**
   * เปิด/ปิด Email Account
   */
  async toggleMailAccount(email: string, enable: boolean): Promise<PleskApiResponse> {
    try {
      const action = enable ? '--on' : '--off'
      const response = await this.client.post('/cli/mail/call', {
        params: ['--update', email, action]
      })
      
      if (response.data.code !== 0) {
        throw new Error(response.data.stderr || `Failed to ${enable ? 'enable' : 'disable'} email`)
      }

      return {
        code: 0,
        stdout: response.data.stdout
      }
    } catch (error: any) {
      console.error(`Failed to ${enable ? 'enable' : 'disable'} mail:`, error.response?.data || error.message)
      throw new Error(error.response?.data?.stderr || 'ไม่สามารถเปลี่ยนสถานะอีเมล์ได้')
    }
  }

  /**
   * ตรวจสอบการเชื่อมต่อกับ Plesk
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getDomains()
      return true
    } catch {
      return false
    }
  }
}

export const pleskClient = new PleskClient()
export default pleskClient