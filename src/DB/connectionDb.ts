import mongoose from 'mongoose'
import { MONGO_URI } from '../confing/config.service'

export const connectDb = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      // useNewUrlParser and useUnifiedTopology are defaults in newer mongoose
    })
    console.log('MongoDB connected')
  } catch (err) {
    console.error('MongoDB connection error:', err)
    throw err
  }
}

export default connectDb
