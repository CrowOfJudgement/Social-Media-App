import { Document, Schema, Types, model } from 'mongoose'
import { AvailabilityEnum } from '../../common/enum/user.enum'

export interface IPost extends Document {
  content: string
  availability: AvailabilityEnum
  createdBy: Types.ObjectId
  tags?: Types.ObjectId[]
  createdAt?: Date
  updatedAt?: Date
}

const postSchema = new Schema<IPost>(
  {
    content: { type: String, required: true, trim: true },
    availability: {
      type: String,
      enum: Object.values(AvailabilityEnum),
      default: AvailabilityEnum.Public,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
    strictQuery: false,
  },
)

const PostModel = model<IPost>('Post', postSchema)

export default PostModel
