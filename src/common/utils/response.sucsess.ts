import { Response } from 'express'

export const successResponse = ({
  res,
  data,
  message,
  statusCode = 200,
}: {
  res: Response
  data?: unknown
  message?: string
  statusCode?: number
}) => {
  return res.status(statusCode).json({
    ...(message ? { message } : {}),
    ...(data !== undefined ? { data } : {}),
  })
}
