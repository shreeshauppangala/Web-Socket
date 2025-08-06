import express from 'express';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import authRoutes from './Routes/Auth';
import messageRoutes from './Routes/Messages';
import roomRoutes from './Routes/Rooms';
import User from './Models/User';
import Message from './Models/Message';
import Room from './Models/Room';
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/rooms', roomRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Extend Socket type for custom properties
interface CustomSocket extends Socket {
  userId?: mongoose.Types.ObjectId;
  username?: string;
}

// Socket.IO authentication middleware
io.use(async (socket: CustomSocket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as any;
    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.username = user.username;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.on('connection', async (socket: CustomSocket) => {
  console.log(`User ${socket.username} connected`);

  // Update user online status
  await User.findByIdAndUpdate(socket.userId, {
    isOnline: true,
    lastSeen: new Date(),
  });

  // Join general room
  socket.join('general');

  // Broadcast user joined
  socket.to('general').emit('userJoined', {
    username: socket.username,
    message: `${socket.username} joined the chat`,
  });

  // Handle sending messages
  socket.on('sendMessage', async (data) => {
    try {
      const { content, room = 'general' } = data;

      // Save message to database
      const message = new Message({
        sender: socket.userId,
        content,
        room,
      });

      await message.save();
      await message.populate('sender', 'username');

      // Emit message to all users in the room
      io.to(room).emit('newMessage', {
        _id: message._id,
        content: message.content,
        sender: {
          _id: (message.sender as any)._id,
          username: (message.sender as any).username, // Fix: get username, not _id
        },
        room: message.room,
        createdAt: (message as any).createdAt,
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Join a room (default to 'general')
  socket.on('joinRoom', async (roomName) => {
    // Leave all rooms except socket.id
    Object.keys(socket.rooms).forEach((r) => {
      if (r !== socket.id) socket.leave(r);
    });
    let room = await Room.findOne({ name: roomName });
    if (!room) {
      room = new Room({ name: roomName, users: [socket.userId] });
      await room.save();
    } else if (socket.userId && !room.users.includes(socket.userId)) {
      room.users.push(socket.userId);
      await room.save();
    }
    socket.join(roomName);
    socket.emit('joinedRoom', roomName);
    // Notify others
    socket.to(roomName).emit('userJoined', {
      username: socket.username,
      message: `${socket.username} joined the room`,
    });
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    socket.to(data.room || 'general').emit('userTyping', {
      username: socket.username,
      isTyping: data.isTyping,
    });
  });

  // On disconnect, remove user from all rooms
  socket.on('disconnect', async () => {
    console.log(`User ${socket.username} disconnected`);

    // Update user offline status
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: false,
      lastSeen: new Date(),
    });

    // Remove user from all rooms
    await Room.updateMany(
      { users: socket.userId },
      { $pull: { users: socket.userId } }
    );

    // Broadcast user left
    socket.to('general').emit('userLeft', {
      username: socket.username,
      message: `${socket.username} left the chat`,
    });
  });
});

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
