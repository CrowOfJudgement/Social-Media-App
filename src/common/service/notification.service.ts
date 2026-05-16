import admin from 'firebase-admin'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

type SendNotificationParams = {
  token: string
  data: {
    title: string
    body: string
  }
}

type SendNotificationsParams = {
  tokens: string[]
  data: {
    title: string
    body: string
  }
}

class NotificationService {
  private readonly client: admin.app.App

  constructor() {
    const serviceAccountPath = this.getServiceAccountPath()
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'))

    this.client = admin.apps.length
      ? admin.app()
      : admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        })
  }

  private getServiceAccountPath() {
    const possiblePaths = [
      resolve(process.cwd(), 'src/confing/social-media-app-1dbca-firebase-adminsdk-fbsvc-0462369b19.json'),
      resolve(process.cwd(), 'dist/confing/social-media-app-1dbca-firebase-adminsdk-fbsvc-0462369b19.json'),
    ]

    const serviceAccountPath = possiblePaths.find(path => existsSync(path))

    if (!serviceAccountPath) {
      throw new Error('Firebase service account file was not found')
    }

    return serviceAccountPath
  }

  async sendNotification({ token, data }: SendNotificationParams) {
    const message: admin.messaging.Message = {
      token,
      data,
    }

    return await this.client.messaging().send(message)
  }

  async sendNotifications({ tokens, data }: SendNotificationsParams) {
    return await Promise.all(
      tokens.map(token => {
        return this.sendNotification({ token, data })
      }),
    )
  }
}

const notificationService = new NotificationService()

export default notificationService
