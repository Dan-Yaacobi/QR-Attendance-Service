import QRCode from 'qrcode'

export async function makeQrPngBuffer(url) {
  // Returns PNG buffer (no file writes)
  return await QRCode.toBuffer(url, { type: 'png', errorCorrectionLevel: 'M' })
}
