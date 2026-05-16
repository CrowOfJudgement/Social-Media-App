import { tmpdir } from 'node:os'
import type { Request } from 'express'
import multer from 'multer'
import { multer_enum, StoreTypeEnum } from '../enum/multer.enum'

const multerCloud = ({
  store_type = StoreTypeEnum.Memory,
  custom_types = multer_enum.image,
  max_size = 5 * 1024 * 1024,
}: {
  store_type?: StoreTypeEnum
  custom_types?: string[]
  max_size?: number
}) => {
  const storage =
    store_type === StoreTypeEnum.Memory
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination: tmpdir(),
          filename: function (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
            const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`
            cb(null, `${uniqueSuffix}_${file.originalname}`)
          },
        })

  function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
    if (!custom_types.includes(file.mimetype)) {
      return cb(new Error('Invalid file type!'))
    }

    cb(null, true)
  }

  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: max_size,
    },
  })
  return upload
}

export default multerCloud
