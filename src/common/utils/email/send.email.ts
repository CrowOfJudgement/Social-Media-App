import nodemailer, { type SendMailOptions } from 'nodemailer'
import { EMAIL, EMAIL_FROM_NAME, EMAIL_PASSWORD } from '../../../confing/config.service'

type SendEmailParams = {
  to: string
  subject?: string
  html?: string
  attachments?: SendMailOptions['attachments']
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL,
    pass: EMAIL_PASSWORD,
  },
})

export const sendEmail = async ({
  to,
  subject = '',
  html = '',
  attachments = [],
}: SendEmailParams): Promise<boolean> => {
  if (!EMAIL || !EMAIL_PASSWORD) {
    throw new Error('Email credentials are not configured')
  }

  const info = await transporter.sendMail({
    from: `"${EMAIL_FROM_NAME}" <${EMAIL}>`,
    to,
    subject,
    html,
    attachments,
  })

  console.log('Message sent:', info.messageId)
  return info.accepted.length > 0
}

export const generateOtp = (): number => Math.floor(Math.random() * 900000 + 100000)
