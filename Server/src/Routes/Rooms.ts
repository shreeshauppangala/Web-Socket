import express, { Response } from 'express';
import auth, { AuthRequest } from '../Middlewares/Auth';
import Room from '../Models/Room';
import User from '../Models/User';
import mongoose from 'mongoose';

const router = express.Router();

// List all rooms
router.get('/', auth, async (_req: AuthRequest, res: Response) => {
  const rooms = await Room.find().select('name');
  res.json(rooms);
});

// Create a new room
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Room name required' });
  const exists = await Room.findOne({ name });
  if (exists) return res.status(400).json({ message: 'Room already exists' });
  const room = new Room({ name, users: [req.user!._id] });
  await room.save();
  res.status(201).json(room);
});

// Join a room
router.post('/:roomId/join', auth, async (req: AuthRequest, res: Response) => {
  const { roomId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(roomId)) return res.status(400).json({ message: 'Invalid Room ID' });
  const room = await Room.findById(roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  if (!room.users.includes(req.user!._id)) {
    room.users.push(req.user!._id);
    await room.save();
  }
  res.json(room);
});

// Get users in a room
router.get('/:roomId/users', auth, async (req: AuthRequest, res: Response) => {
  const { roomId } = req.params;
  const room = await Room.findById(roomId).populate('users', 'username email isOnline');
  if (!room) return res.status(404).json({ message: 'Room not found' });
  res.json(room.users);
});

export default router;
