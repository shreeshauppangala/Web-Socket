import mongoose, { Document, Model, Schema } from 'mongoose';

export interface RoomDoc extends Document {
  name: string;
  users: mongoose.Types.ObjectId[];
}

const roomSchema = new Schema<RoomDoc>(
  {
    name: { type: String, required: true, unique: true },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const Room: Model<RoomDoc> = mongoose.model<RoomDoc>('Room', roomSchema);
export default Room;
