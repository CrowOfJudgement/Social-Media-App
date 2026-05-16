import { Document, Schema, Types, model } from 'mongoose'

export interface IComment extends Document {
  content: string
  postId: Types.ObjectId
  createdBy: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

const commentSchema = new Schema<IComment>(
  {
    content: { type: String, required: true, trim: true },
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    strictQuery: false,
  },
)

const CommentModel = model<IComment>('Comment', commentSchema)

export default CommentModel
