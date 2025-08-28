import nodemailer from 'nodemailer'

export function buildTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  })
}

export async function sendConfirmationEmail({ to, subject = 'Attendance Confirmed', text }) {
  const transporter = buildTransport()
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text
  })
  return info
}
