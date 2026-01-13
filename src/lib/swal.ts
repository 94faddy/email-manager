// src/lib/swal.ts
'use client'

import Swal, { SweetAlertResult } from 'sweetalert2'

// สี theme สำหรับ SweetAlert
const theme = {
  background: '#1e293b',
  color: '#f8fafc',
  confirmButtonColor: '#6366f1',
  cancelButtonColor: '#64748b',
  denyButtonColor: '#ef4444',
}

// Toast notification
export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: theme.background,
  color: theme.color,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer
    toast.onmouseleave = Swal.resumeTimer
  }
})

// Success notification
export const showSuccess = (message: string, title?: string): Promise<SweetAlertResult> => {
  return Toast.fire({
    icon: 'success',
    title: title || 'สำเร็จ',
    text: message,
  })
}

// Error notification
export const showError = (message: string, title?: string): Promise<SweetAlertResult> => {
  return Swal.fire({
    icon: 'error',
    title: title || 'เกิดข้อผิดพลาด',
    text: message,
    background: theme.background,
    color: theme.color,
    confirmButtonColor: theme.confirmButtonColor,
  })
}

// Warning notification
export const showWarning = (message: string, title?: string): Promise<SweetAlertResult> => {
  return Swal.fire({
    icon: 'warning',
    title: title || 'คำเตือน',
    text: message,
    background: theme.background,
    color: theme.color,
    confirmButtonColor: theme.confirmButtonColor,
  })
}

// Info notification
export const showInfo = (message: string, title?: string): Promise<SweetAlertResult> => {
  return Swal.fire({
    icon: 'info',
    title: title || 'ข้อมูล',
    text: message,
    background: theme.background,
    color: theme.color,
    confirmButtonColor: theme.confirmButtonColor,
  })
}

// Confirm dialog
export const showConfirm = (
  message: string,
  title?: string,
  confirmText?: string,
  cancelText?: string
): Promise<SweetAlertResult> => {
  return Swal.fire({
    icon: 'question',
    title: title || 'ยืนยันการทำรายการ',
    text: message,
    showCancelButton: true,
    confirmButtonText: confirmText || 'ยืนยัน',
    cancelButtonText: cancelText || 'ยกเลิก',
    background: theme.background,
    color: theme.color,
    confirmButtonColor: theme.confirmButtonColor,
    cancelButtonColor: theme.cancelButtonColor,
    reverseButtons: true,
  })
}

// Delete confirm dialog
export const showDeleteConfirm = (
  itemName: string,
  message?: string
): Promise<SweetAlertResult> => {
  return Swal.fire({
    icon: 'warning',
    title: `ลบ ${itemName}?`,
    text: message || 'การกระทำนี้ไม่สามารถย้อนกลับได้',
    showCancelButton: true,
    confirmButtonText: 'ลบ',
    cancelButtonText: 'ยกเลิก',
    background: theme.background,
    color: theme.color,
    confirmButtonColor: theme.denyButtonColor,
    cancelButtonColor: theme.cancelButtonColor,
    reverseButtons: true,
  })
}

// Loading dialog
export const showLoading = (message?: string): void => {
  Swal.fire({
    title: message || 'กำลังดำเนินการ...',
    allowOutsideClick: false,
    allowEscapeKey: false,
    background: theme.background,
    color: theme.color,
    didOpen: () => {
      Swal.showLoading()
    }
  })
}

// Close loading
export const closeLoading = (): void => {
  Swal.close()
}

// Input dialog
export const showInput = async (
  title: string,
  placeholder?: string,
  inputType: 'text' | 'password' | 'email' = 'text'
): Promise<string | null> => {
  const result = await Swal.fire({
    title,
    input: inputType,
    inputPlaceholder: placeholder || '',
    showCancelButton: true,
    confirmButtonText: 'ตกลง',
    cancelButtonText: 'ยกเลิก',
    background: theme.background,
    color: theme.color,
    confirmButtonColor: theme.confirmButtonColor,
    cancelButtonColor: theme.cancelButtonColor,
    inputAttributes: {
      autocapitalize: 'off',
      autocorrect: 'off',
    },
    customClass: {
      input: 'swal-dark-input'
    }
  })

  return result.isConfirmed ? result.value : null
}

export default Swal
