import express, { Response } from 'express';
import jwt from 'jsonwebtoken';
import auth, { AuthRequest } from '../Middlewares/Auth';
import User from '../Models/User';

const router = express.Router();

// Register
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email or username',
      });
    }

    // Create user
    const user = new User({ username, email, password });
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      {
        expiresIn: '7d',
      }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error:any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update online status
    user.isOnline = true;
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      {
        expiresIn: '7d',
      }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error:any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  res.json({
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
});

// Logout
router.post('/logout', auth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    user.isOnline = false;
    user.lastSeen = new Date();
    await user.save();

    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
