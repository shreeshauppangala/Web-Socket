import express, { Request, Response } from 'express';
import Message from '../models/Message';
import auth from '../Middlewares/auth';

const router = express.Router();

// Get messages for a room
router.get('/:room', auth, async (req: Request, res: Response) => {
  try {
    const { room } = req.params;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '50', 10);

    const messages = await Message.find({ room })
      .populate('sender', 'username')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send message (mainly for API, real-time via WebSocket)
router.post('/', auth, async (req: Request, res: Response) => {
  try {
    const { content, room = 'general' } = req.body;

    const message = new Message({
      sender: (req as any).user._id,
      content,
      room,
    });

    await message.save();
    await message.populate('sender', 'username');

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
