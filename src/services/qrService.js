import QRCode from 'qrcode'

export async function generateCourseQrDataUrl({ courseId = 'TEST', token = 'abc123' }) {
  const payload = {
    courseId,
    token,
    ts: Date.now()
  }
  const url = `${process.env.BASE_URL || 'http://localhost:8080'}/attendance/checkin?data=${encodeURIComponent(JSON.stringify(payload))}`
  return await QRCode.toDataURL(url, { errorCorrectionLevel: 'M' })
}
