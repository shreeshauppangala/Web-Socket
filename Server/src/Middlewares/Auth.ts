import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User, { UserDoc } from '../Models/User';
import mongoose from 'mongoose';

export interface AuthRequest extends Request {
  user?: UserDoc;
}

const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader =
      req.header('Authorization') || req.header('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export default auth;
