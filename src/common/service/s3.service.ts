import { createReadStream } from 'node:fs'
import { randomUUID } from 'node:crypto'
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { StoreTypeEnum } from '../enum/multer.enum'
import {
  AWS_ACCESS_KEY_ID,
  AWS_BUCKET_NAME,
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY,
} from '../../confing/config.service'
import { appError } from '../utils/global-error-handlier'

type UploadFileParams = {
  file: Express.Multer.File
  store_type?: StoreTypeEnum
  path?: string
  ACL?: ObjectCannedACL
}

type UploadFilesParams = {
  files: Express.Multer.File[]
  store_type?: StoreTypeEnum
  path?: string
  ACL?: ObjectCannedACL
  isLarge?: boolean
}

class S3Service {
  private client: S3Client | null = null

  constructor() {
  }

  private getClient() {
    if (!AWS_BUCKET_NAME || !AWS_REGION) {
      throw new appError('AWS S3 is not configured', 500)
    }

    if (!this.client) {
      this.client = new S3Client({
        region: AWS_REGION,
        ...(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
          ? {
              credentials: {
                accessKeyId: AWS_ACCESS_KEY_ID,
                secretAccessKey: AWS_SECRET_ACCESS_KEY,
              },
            }
          : {}),
      })
    }

    return this.client
  }

  async uploadFile({
    file,
    store_type = StoreTypeEnum.Memory,
    path = 'General',
    ACL = ObjectCannedACL.private,
  }: UploadFileParams): Promise<string> {
    if (!file) {
      throw new appError('File is required', 400)
    }

    const key = `social_media_app_2/${path}/${randomUUID()}_${file.originalname}`
    const client = this.getClient()

    const command = new PutObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      ACL,
      Key: key,
      Body: store_type === StoreTypeEnum.Memory ? file.buffer : createReadStream(file.path),
      ContentType: file.mimetype,
    })

    if (!command.input.Key) {
      throw new appError('fail to upload file', 500)
    }

    await client.send(command)

    return command.input.Key
  }

  async uploadLargeFile({
    file,
    store_type = StoreTypeEnum.Disk,
    path = 'General',
    ACL = ObjectCannedACL.private,
  }: UploadFileParams): Promise<string> {
    if (!file) {
      throw new appError('File is required', 400)
    }

    const client = this.getClient()

    const command = new Upload({
      client,
      params: {
        Bucket: AWS_BUCKET_NAME,
        ACL,
        Key: `social_media_app_2/${path}/${randomUUID()}_${file.originalname}`,
        Body: store_type === StoreTypeEnum.Memory ? file.buffer : createReadStream(file.path),
        ContentType: file.mimetype,
      },
    })

    command.on('httpUploadProgress', progress => {
      console.log(progress)
    })

    const result = await command.done()

    return result.Key as string
  }

  async uploadFiles({
    files,
    store_type = StoreTypeEnum.Memory,
    path = 'General',
    ACL = ObjectCannedACL.private,
    isLarge = false,
  }: UploadFilesParams): Promise<string[]> {
    if (!files.length) {
      throw new appError('Files are required', 400)
    }

    let urls: string[] = []

    if (isLarge) {
      urls = await Promise.all(
        files.map(file => {
          return this.uploadLargeFile({ file, store_type, path, ACL })
        }),
      )
    } else {
      urls = await Promise.all(
        files.map(file => {
          return this.uploadFile({ file, store_type, path, ACL })
        }),
      )
    }

    return urls
  }

  async getFile(Key: string) {
    if (!Key) {
      throw new appError('File key is required', 400)
    }

    const client = this.getClient()

    return await client.send(
      new GetObjectCommand({
        Bucket: AWS_BUCKET_NAME,
        Key,
      }),
    )
  }

  async getPreSignedUrl({
    Key,
    expiresIn = 60,
    download = 'true',
  }: {
    Key: string
    expiresIn?: number
    download?: string
  }) {
    if (!Key) {
      throw new appError('File key is required', 400)
    }

    const client = this.getClient()

    const command = new GetObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key,
      ...(download
        ? {
            ResponseContentDisposition: `attachment; filename="${Key.split('/').pop()}"`
          }
        : {}),
    })

    return await getSignedUrl(client, command, { expiresIn })
  }

  async deleteFile(Key: string) {
    if (!Key) {
      throw new appError('File key is required', 400)
    }

    const client = this.getClient()
    const command = new DeleteObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key,
    })

    return await client.send(command)
  }

  async deleteFiles(Keys: string[]) {
    if (!Keys.length) {
      throw new appError('File keys are required', 400)
    }

    const client = this.getClient()
    const keyMapped = Keys.map(k => {
      return { Key: k }
    })

    const command = new DeleteObjectsCommand({
      Bucket: AWS_BUCKET_NAME,
      Delete: {
        Objects: keyMapped,
      },
    })

    return await client.send(command)
  }

  async deleteFolder(Prefix: string) {
    if (!Prefix) {
      throw new appError('Folder path is required', 400)
    }

    const client = this.getClient()
    const listedObjects = await client.send(
      new ListObjectsV2Command({
        Bucket: AWS_BUCKET_NAME,
        Prefix,
      }),
    )

    const Keys = (listedObjects.Contents || [])
      .map(item => item.Key)
      .filter((key): key is string => Boolean(key))

    if (!Keys.length) {
      return listedObjects
    }

    return await this.deleteFiles(Keys)
  }
}

const s3Service = new S3Service()

export default s3Service
