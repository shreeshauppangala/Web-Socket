const express = require('express');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

// Get messages for a room
router.get('/:room', auth, async (req, res) => {
  try {
    const { room } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({ room })
      .populate('sender', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send message (mainly for API, real-time via WebSocket)
router.post('/', auth, async (req, res) => {
  try {
    const { content, room = 'general' } = req.body;

    const message = new Message({
      sender: req.user._id,
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

module.exports = router;
