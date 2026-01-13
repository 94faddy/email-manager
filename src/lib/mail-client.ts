// src/lib/mail-client.ts
import Imap from 'imap'
import { simpleParser, AddressObject } from 'mailparser'
import nodemailer from 'nodemailer'

// Helper function to parse address field
function parseAddresses(addr: AddressObject | AddressObject[] | undefined): { name: string; address: string }[] {
  if (!addr) return []
  
  // If it's an array of AddressObject
  if (Array.isArray(addr)) {
    return addr.flatMap(a => a.value?.map(v => ({
      name: v.name || '',
      address: v.address || ''
    })) || [])
  }
  
  // If it's a single AddressObject
  return addr.value?.map(v => ({
    name: v.name || '',
    address: v.address || ''
  })) || []
}

export interface MailCredentials {
  email: string
  password: string
  imapHost?: string
  imapPort?: number
  smtpHost?: string
  smtpPort?: number
}

export interface MailFolder {
  name: string
  path: string
  delimiter: string
  flags: string[]
  specialUse?: string
  messages?: {
    total: number
    unseen: number
  }
}

export interface MailMessage {
  uid: number
  messageId: string
  subject: string
  from: {
    name: string
    address: string
  }[]
  to: {
    name: string
    address: string
  }[]
  cc?: {
    name: string
    address: string
  }[]
  date: Date
  flags: string[]
  isRead: boolean
  hasAttachments: boolean
  snippet?: string
}

export interface MailMessageDetail extends MailMessage {
  html?: string
  text?: string
  attachments: {
    filename: string
    contentType: string
    size: number
    contentId?: string
    content?: Buffer
  }[]
  headers?: Record<string, string>
}

export interface SendMailOptions {
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  text?: string
  html?: string
  attachments?: {
    filename: string
    content: Buffer | string
    contentType?: string
  }[]
  inReplyTo?: string
  references?: string
}

// Default mail server settings (Plesk)
const DEFAULT_IMAP_HOST = process.env.MAIL_IMAP_HOST || 'mail.pix9.my'
const DEFAULT_IMAP_PORT = parseInt(process.env.MAIL_IMAP_PORT || '993')
const DEFAULT_SMTP_HOST = process.env.MAIL_SMTP_HOST || 'mail.pix9.my'
const DEFAULT_SMTP_PORT = parseInt(process.env.MAIL_SMTP_PORT || '465')

/**
 * Create IMAP connection
 */
function createImapConnection(credentials: MailCredentials): Imap {
  return new Imap({
    user: credentials.email,
    password: credentials.password,
    host: credentials.imapHost || DEFAULT_IMAP_HOST,
    port: credentials.imapPort || DEFAULT_IMAP_PORT,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  })
}

/**
 * Create SMTP transporter
 */
function createSmtpTransporter(credentials: MailCredentials) {
  return nodemailer.createTransport({
    host: credentials.smtpHost || DEFAULT_SMTP_HOST,
    port: credentials.smtpPort || DEFAULT_SMTP_PORT,
    secure: true,
    auth: {
      user: credentials.email,
      pass: credentials.password
    },
    tls: {
      rejectUnauthorized: false
    }
  })
}

/**
 * Test mail credentials (IMAP connection)
 */
export function testCredentials(credentials: MailCredentials): Promise<boolean> {
  return new Promise((resolve) => {
    const imap = createImapConnection(credentials)
    
    imap.once('ready', () => {
      imap.end()
      resolve(true)
    })
    
    imap.once('error', () => {
      resolve(false)
    })
    
    imap.connect()
  })
}

/**
 * Get list of mail folders
 */
export function getMailFolders(credentials: MailCredentials): Promise<MailFolder[]> {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection(credentials)
    
    imap.once('ready', () => {
      imap.getBoxes((err, boxes) => {
        if (err) {
          imap.end()
          return reject(err)
        }
        
        const folders: MailFolder[] = []
        
        function parseBoxes(boxes: any, prefix = '') {
          for (const [name, box] of Object.entries(boxes) as any) {
            const path = prefix ? `${prefix}${box.delimiter}${name}` : name
            
            folders.push({
              name,
              path,
              delimiter: box.delimiter,
              flags: box.attribs || [],
              specialUse: box.special_use_attrib
            })
            
            if (box.children) {
              parseBoxes(box.children, path)
            }
          }
        }
        
        parseBoxes(boxes)
        imap.end()
        resolve(folders)
      })
    })
    
    imap.once('error', reject)
    imap.connect()
  })
}

/**
 * Get folder status (message count)
 */
export function getFolderStatus(
  credentials: MailCredentials, 
  folder: string
): Promise<{ total: number; unseen: number }> {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection(credentials)
    
    imap.once('ready', () => {
      imap.status(folder, (err, box) => {
        if (err) {
          imap.end()
          return reject(err)
        }
        
        imap.end()
        resolve({
          total: box.messages.total,
          unseen: box.messages.unseen
        })
      })
    })
    
    imap.once('error', reject)
    imap.connect()
  })
}

/**
 * Get messages in a folder
 */
export function getMessages(
  credentials: MailCredentials,
  folder: string,
  options: {
    page?: number
    limit?: number
    search?: string
  } = {}
): Promise<{ messages: MailMessage[]; total: number }> {
  const { page = 1, limit = 50, search } = options
  
  return new Promise((resolve, reject) => {
    const imap = createImapConnection(credentials)
    
    imap.once('ready', () => {
      imap.openBox(folder, true, (err, box) => {
        if (err) {
          imap.end()
          return reject(err)
        }
        
        const total = box.messages.total
        
        if (total === 0) {
          imap.end()
          return resolve({ messages: [], total: 0 })
        }
        
        const searchCriteria = search ? [['TEXT', search]] : ['ALL']
        
        imap.search(searchCriteria as any, (err, results) => {
          if (err) {
            imap.end()
            return reject(err)
          }
          
          if (results.length === 0) {
            imap.end()
            return resolve({ messages: [], total: 0 })
          }
          
          // Get latest messages first
          const sortedResults = results.sort((a, b) => b - a)
          const pageResults = sortedResults.slice((page - 1) * limit, page * limit)
          
          if (pageResults.length === 0) {
            imap.end()
            return resolve({ messages: [], total: results.length })
          }
          
          const fetch = imap.fetch(pageResults, {
            bodies: ['HEADER.FIELDS (FROM TO CC SUBJECT DATE MESSAGE-ID)'],
            struct: true
          })
          
          const messages: MailMessage[] = []
          
          fetch.on('message', (msg) => {
            let uid = 0
            let attrs: any = {}
            let headerBuffer = ''
            
            msg.on('body', (stream) => {
              stream.on('data', (chunk) => {
                headerBuffer += chunk.toString('utf8')
              })
            })
            
            msg.once('attributes', (a) => {
              attrs = a
              uid = a.uid
            })
            
            msg.once('end', () => {
              const headers = Imap.parseHeader(headerBuffer)
              
              const from = headers.from?.[0] || ''
              const fromMatch = from.match(/(?:"?([^"]*)"?\s)?<?([^>]+)>?/)
              
              const hasAttachments = attrs.struct?.some((part: any) => 
                part.disposition?.type === 'attachment' ||
                (Array.isArray(part) && part.some((p: any) => p.disposition?.type === 'attachment'))
              )
              
              messages.push({
                uid,
                messageId: headers['message-id']?.[0] || '',
                subject: headers.subject?.[0] || '(No Subject)',
                from: [{
                  name: fromMatch?.[1] || '',
                  address: fromMatch?.[2] || from
                }],
                to: parseAddressString(headers.to?.[0] || ''),
                cc: headers.cc ? parseAddressString(headers.cc[0]) : undefined,
                date: new Date(headers.date?.[0] || Date.now()),
                flags: attrs.flags || [],
                isRead: attrs.flags?.includes('\\Seen') || false,
                hasAttachments: !!hasAttachments
              })
            })
          })
          
          fetch.once('error', (err) => {
            imap.end()
            reject(err)
          })
          
          fetch.once('end', () => {
            imap.end()
            // Sort by date descending
            messages.sort((a, b) => b.date.getTime() - a.date.getTime())
            resolve({ messages, total: results.length })
          })
        })
      })
    })
    
    imap.once('error', reject)
    imap.connect()
  })
}

/**
 * Get single message detail
 */
export function getMessage(
  credentials: MailCredentials,
  folder: string,
  uid: number
): Promise<MailMessageDetail | null> {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection(credentials)
    
    imap.once('ready', () => {
      imap.openBox(folder, false, (err) => {
        if (err) {
          imap.end()
          return reject(err)
        }
        
        const fetch = imap.fetch([uid], {
          bodies: '',
          struct: true,
          markSeen: true
        })
        
        let message: MailMessageDetail | null = null
        
        fetch.on('message', (msg) => {
          let attrs: any = {}
          let rawEmail = Buffer.alloc(0)
          
          msg.on('body', (stream) => {
            const chunks: Buffer[] = []
            stream.on('data', (chunk) => chunks.push(chunk))
            stream.once('end', () => {
              rawEmail = Buffer.concat(chunks)
            })
          })
          
          msg.once('attributes', (a) => {
            attrs = a
          })
          
          msg.once('end', async () => {
            try {
              const parsed = await simpleParser(rawEmail)
              
              message = {
                uid: attrs.uid,
                messageId: parsed.messageId || '',
                subject: parsed.subject || '(No Subject)',
                from: parseAddresses(parsed.from),
                to: parseAddresses(parsed.to),
                cc: parseAddresses(parsed.cc),
                date: parsed.date || new Date(),
                flags: attrs.flags || [],
                isRead: attrs.flags?.includes('\\Seen') || false,
                hasAttachments: (parsed.attachments?.length || 0) > 0,
                html: parsed.html || undefined,
                text: parsed.text || undefined,
                attachments: parsed.attachments?.map(att => ({
                  filename: att.filename || 'attachment',
                  contentType: att.contentType,
                  size: att.size,
                  contentId: att.contentId,
                  content: att.content
                })) || []
              }
            } catch (parseErr) {
              console.error('Parse error:', parseErr)
            }
          })
        })
        
        fetch.once('error', (err) => {
          imap.end()
          reject(err)
        })
        
        fetch.once('end', () => {
          imap.end()
          setTimeout(() => resolve(message), 100)
        })
      })
    })
    
    imap.once('error', reject)
    imap.connect()
  })
}

/**
 * Find special folder by type (Sent, Drafts, Trash, Spam, etc.)
 * Handles INBOX. namespace prefix for Plesk/Dovecot servers
 */
export function findSpecialFolder(
  credentials: MailCredentials,
  folderType: 'Sent' | 'Drafts' | 'Trash' | 'Spam' | 'Junk'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection(credentials)
    
    // Common folder names for each type
    const folderNames: Record<string, string[]> = {
      'Sent': ['Sent', 'Sent Messages', 'Sent Items', 'Sent Mail'],
      'Drafts': ['Drafts', 'Draft'],
      'Trash': ['Trash', 'Deleted', 'Deleted Items', 'Deleted Messages'],
      'Spam': ['Spam', 'Junk', 'Junk E-mail', 'Junk Mail'],
      'Junk': ['Junk', 'Spam', 'Junk E-mail', 'Junk Mail']
    }
    
    // Special use attributes
    const specialUseAttribs: Record<string, string> = {
      'Sent': '\\Sent',
      'Drafts': '\\Drafts',
      'Trash': '\\Trash',
      'Spam': '\\Junk',
      'Junk': '\\Junk'
    }
    
    const targetNames = folderNames[folderType] || [folderType]
    const targetAttrib = specialUseAttribs[folderType]
    
    imap.once('ready', () => {
      imap.getBoxes((err, boxes) => {
        if (err) {
          imap.end()
          return reject(err)
        }
        
        let delimiter = '.'
        let foundFolder: string | null = null
        
        function findInBoxes(boxes: any, prefix = ''): string | null {
          for (const [name, box] of Object.entries(boxes) as any) {
            const path = prefix ? `${prefix}${box.delimiter}${name}` : name
            delimiter = box.delimiter || '.'
            
            // Check special use attribute first
            if (targetAttrib && box.special_use_attrib === targetAttrib) {
              return path
            }
            
            // Check folder name
            if (targetNames.some(n => name.toLowerCase() === n.toLowerCase())) {
              return path
            }
            
            // Check children
            if (box.children) {
              const found = findInBoxes(box.children, path)
              if (found) return found
            }
          }
          return null
        }
        
        foundFolder = findInBoxes(boxes)
        
        // If not found, try common patterns with INBOX prefix
        if (!foundFolder) {
          // Check INBOX.FolderName pattern (Plesk/Dovecot)
          if (boxes['INBOX']?.children) {
            for (const [childName] of Object.entries(boxes['INBOX'].children) as any) {
              if (targetNames.some(n => childName.toLowerCase() === n.toLowerCase())) {
                foundFolder = `INBOX${delimiter}${childName}`
                break
              }
            }
          }
        }
        
        // Default fallback with INBOX prefix for Plesk
        if (!foundFolder) {
          foundFolder = `INBOX${delimiter}${folderType}`
        }
        
        imap.end()
        console.log(`Found ${folderType} folder: ${foundFolder}`)
        resolve(foundFolder)
      })
    })
    
    imap.once('error', reject)
    imap.connect()
  })
}

/**
 * Find Sent folder name (different servers use different names)
 * @deprecated Use findSpecialFolder(credentials, 'Sent') instead
 */
export function findSentFolder(credentials: MailCredentials): Promise<string> {
  return findSpecialFolder(credentials, 'Sent')
}

/**
 * Find Drafts folder name
 */
export function findDraftsFolder(credentials: MailCredentials): Promise<string> {
  return findSpecialFolder(credentials, 'Drafts')
}

/**
 * Find Trash folder name
 */
export function findTrashFolder(credentials: MailCredentials): Promise<string> {
  return findSpecialFolder(credentials, 'Trash')
}

/**
 * Append message to folder (for Sent/Drafts)
 */
export function appendToFolder(
  credentials: MailCredentials,
  folder: string,
  rawMessage: string | Buffer,
  flags: string[] = []
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection(credentials)
    
    imap.once('ready', () => {
      console.log(`Appending to folder: ${folder}`)
      imap.append(rawMessage, { mailbox: folder, flags }, (err) => {
        imap.end()
        if (err) {
          console.error('Append error:', err)
          return reject(err)
        }
        console.log(`Successfully appended to: ${folder}`)
        resolve(true)
      })
    })
    
    imap.once('error', reject)
    imap.connect()
  })
}

/**
 * Build raw email message for IMAP append
 */
function buildRawEmail(
  from: string,
  options: SendMailOptions
): string {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2)}`
  const date = new Date().toUTCString()
  const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2)}@${from.split('@')[1]}>`
  
  const to = Array.isArray(options.to) ? options.to.join(', ') : options.to
  const cc = options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : ''
  
  let headers = [
    `From: ${from}`,
    `To: ${to}`,
    cc ? `Cc: ${cc}` : '',
    `Subject: =?UTF-8?B?${Buffer.from(options.subject || '').toString('base64')}?=`,
    `Date: ${date}`,
    `Message-ID: ${messageId}`,
    `MIME-Version: 1.0`,
  ].filter(Boolean).join('\r\n')

  if (options.inReplyTo) {
    headers += `\r\nIn-Reply-To: ${options.inReplyTo}`
    headers += `\r\nReferences: ${options.references || options.inReplyTo}`
  }

  let body = ''
  
  if (options.attachments && options.attachments.length > 0) {
    headers += `\r\nContent-Type: multipart/mixed; boundary="${boundary}"`
    
    body = `\r\n\r\n--${boundary}\r\n`
    body += `Content-Type: text/plain; charset=UTF-8\r\n`
    body += `Content-Transfer-Encoding: base64\r\n\r\n`
    body += Buffer.from(options.text || '').toString('base64')
    
    for (const att of options.attachments) {
      body += `\r\n--${boundary}\r\n`
      body += `Content-Type: ${att.contentType || 'application/octet-stream'}; name="${att.filename}"\r\n`
      body += `Content-Disposition: attachment; filename="${att.filename}"\r\n`
      body += `Content-Transfer-Encoding: base64\r\n\r\n`
      const content = Buffer.isBuffer(att.content) ? att.content : Buffer.from(att.content)
      body += content.toString('base64')
    }
    
    body += `\r\n--${boundary}--`
  } else {
    headers += `\r\nContent-Type: text/plain; charset=UTF-8`
    headers += `\r\nContent-Transfer-Encoding: base64`
    body = `\r\n\r\n${Buffer.from(options.text || '').toString('base64')}`
  }

  return headers + body
}

/**
 * Send email (basic - without saving to Sent)
 */
export async function sendMail(
  credentials: MailCredentials,
  options: SendMailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = createSmtpTransporter(credentials)
    
    const result = await transporter.sendMail({
      from: credentials.email,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType
      })),
      inReplyTo: options.inReplyTo,
      references: options.references
    })
    
    return {
      success: true,
      messageId: result.messageId
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Send email AND save to Sent folder
 */
export async function sendMailAndSave(
  credentials: MailCredentials,
  options: SendMailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = createSmtpTransporter(credentials)
    
    // 1. Send email via SMTP
    const result = await transporter.sendMail({
      from: credentials.email,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType
      })),
      inReplyTo: options.inReplyTo,
      references: options.references
    })

    // 2. Save to Sent folder via IMAP
    try {
      // Find the correct Sent folder name (handles INBOX. prefix)
      const sentFolder = await findSpecialFolder(credentials, 'Sent')
      console.log('Saving to Sent folder:', sentFolder)
      
      // Build raw email
      const rawEmail = buildRawEmail(credentials.email, options)
      
      // Append to Sent folder
      await appendToFolder(credentials, sentFolder, rawEmail, ['\\Seen'])
      console.log('Email saved to Sent folder successfully')
    } catch (appendErr) {
      // Log but don't fail the whole operation
      console.error('Failed to save to Sent folder:', appendErr)
    }
    
    return {
      success: true,
      messageId: result.messageId
    }
  } catch (error: any) {
    console.error('Send email error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Save draft
 */
export async function saveDraft(
  credentials: MailCredentials,
  options: SendMailOptions
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find the correct Drafts folder name (handles INBOX. prefix)
    const draftsFolder = await findSpecialFolder(credentials, 'Drafts')
    console.log('Saving draft to folder:', draftsFolder)
    
    const rawEmail = buildRawEmail(credentials.email, options)
    await appendToFolder(credentials, draftsFolder, rawEmail, ['\\Draft', '\\Seen'])
    
    console.log('Draft saved successfully')
    return { success: true }
  } catch (error: any) {
    console.error('Save draft error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Delete message (move to Trash or permanent delete)
 */
export async function deleteMessage(
  credentials: MailCredentials,
  folder: string,
  uid: number,
  permanent = false
): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    const imap = createImapConnection(credentials)
    
    // Find the correct Trash folder
    let trashFolder = 'Trash'
    if (!permanent && !folder.toLowerCase().includes('trash')) {
      try {
        trashFolder = await findSpecialFolder(credentials, 'Trash')
      } catch (e) {
        console.log('Could not find Trash folder, using default')
      }
    }
    
    imap.once('ready', () => {
      imap.openBox(folder, false, (err) => {
        if (err) {
          imap.end()
          return reject(err)
        }
        
        if (permanent || folder.toLowerCase().includes('trash')) {
          // Permanent delete
          imap.addFlags([uid], ['\\Deleted'], (err) => {
            if (err) {
              imap.end()
              return reject(err)
            }
            
            imap.expunge((err) => {
              imap.end()
              if (err) return reject(err)
              resolve(true)
            })
          })
        } else {
          // Move to Trash
          console.log(`Moving message to: ${trashFolder}`)
          imap.move([uid], trashFolder, (err) => {
            imap.end()
            if (err) return reject(err)
            resolve(true)
          })
        }
      })
    })
    
    imap.once('error', reject)
    imap.connect()
  })
}

/**
 * Move message to folder
 */
export function moveMessage(
  credentials: MailCredentials,
  fromFolder: string,
  uid: number,
  toFolder: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection(credentials)
    
    imap.once('ready', () => {
      imap.openBox(fromFolder, false, (err) => {
        if (err) {
          imap.end()
          return reject(err)
        }
        
        console.log(`Moving message from ${fromFolder} to ${toFolder}`)
        imap.move([uid], toFolder, (err) => {
          imap.end()
          if (err) return reject(err)
          resolve(true)
        })
      })
    })
    
    imap.once('error', reject)
    imap.connect()
  })
}

/**
 * Mark message as read/unread
 */
export function setMessageRead(
  credentials: MailCredentials,
  folder: string,
  uid: number,
  read: boolean
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection(credentials)
    
    imap.once('ready', () => {
      imap.openBox(folder, false, (err) => {
        if (err) {
          imap.end()
          return reject(err)
        }
        
        const action = read ? imap.addFlags : imap.delFlags
        action.call(imap, [uid], ['\\Seen'], (err: any) => {
          imap.end()
          if (err) return reject(err)
          resolve(true)
        })
      })
    })
    
    imap.once('error', reject)
    imap.connect()
  })
}

/**
 * Star/Unstar message
 */
export function setMessageStarred(
  credentials: MailCredentials,
  folder: string,
  uid: number,
  starred: boolean
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection(credentials)
    
    imap.once('ready', () => {
      imap.openBox(folder, false, (err) => {
        if (err) {
          imap.end()
          return reject(err)
        }
        
        const action = starred ? imap.addFlags : imap.delFlags
        action.call(imap, [uid], ['\\Flagged'], (err: any) => {
          imap.end()
          if (err) return reject(err)
          resolve(true)
        })
      })
    })
    
    imap.once('error', reject)
    imap.connect()
  })
}

/**
 * Create new folder (with INBOX prefix for Plesk)
 */
export function createFolder(
  credentials: MailCredentials,
  folderName: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection(credentials)
    
    imap.once('ready', () => {
      // For Plesk/Dovecot, folders should be under INBOX namespace
      const fullFolderName = folderName.startsWith('INBOX.') ? folderName : `INBOX.${folderName}`
      
      console.log(`Creating folder: ${fullFolderName}`)
      imap.addBox(fullFolderName, (err) => {
        imap.end()
        if (err) return reject(err)
        resolve(true)
      })
    })
    
    imap.once('error', reject)
    imap.connect()
  })
}

/**
 * Delete folder
 */
export function deleteFolder(
  credentials: MailCredentials,
  folderName: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const imap = createImapConnection(credentials)
    
    imap.once('ready', () => {
      imap.delBox(folderName, (err) => {
        imap.end()
        if (err) return reject(err)
        resolve(true)
      })
    })
    
    imap.once('error', reject)
    imap.connect()
  })
}

// Helper function to parse email address string (from IMAP headers)
function parseAddressString(addressStr: string): { name: string; address: string }[] {
  if (!addressStr) return []
  
  const addresses: { name: string; address: string }[] = []
  const parts = addressStr.split(',')
  
  for (const part of parts) {
    const match = part.trim().match(/(?:"?([^"]*)"?\s)?<?([^>]+)>?/)
    if (match) {
      addresses.push({
        name: match[1] || '',
        address: match[2] || part.trim()
      })
    }
  }
  
  return addresses
}

export default {
  testCredentials,
  getMailFolders,
  getFolderStatus,
  getMessages,
  getMessage,
  sendMail,
  sendMailAndSave,
  saveDraft,
  appendToFolder,
  findSentFolder,
  findDraftsFolder,
  findTrashFolder,
  findSpecialFolder,
  deleteMessage,
  moveMessage,
  setMessageRead,
  setMessageStarred,
  createFolder,
  deleteFolder
}