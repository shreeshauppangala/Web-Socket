import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserI } from '../constants/interface';

export interface UserDoc extends Document, UserI {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<UserDoc>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre<UserDoc>('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (
  this: UserDoc,
  candidatePassword: string
) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User: Model<UserDoc> = mongoose.model<UserDoc>('User', userSchema);
export default User;
