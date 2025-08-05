import mongoose, { Document, Model, Schema } from 'mongoose';
import { MessageI } from '../constants/interface';

interface MessageDocument extends Document {
  sender: mongoose.Schema.Types.ObjectId;
  content: string;
  room: string;
  messageType: 'text' | 'system';
}

const messageSchema = new Schema<MessageDocument>(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 500,
    },
    room: {
      type: String,
      default: 'general',
    },
    messageType: {
      type: String,
      enum: ['text', 'system'],
      default: 'text',
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model<MessageDocument>('Message', messageSchema);
export default Message;
