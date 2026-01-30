import express from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, dbRun, dbGet } from '../server.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password required' });
  }

  try {
    const hashedPassword = await bcryptjs.hash(password, 10);
    
    const result = await dbRun(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    // Create default company for user
    const companyResult = await dbRun(
      'INSERT INTO companies (name, description) VALUES (?, ?)',
      [`${username}'s Company`, `Default company for ${username}`]
    );

    // Add user to company
    await dbRun(
      'INSERT INTO user_companies (user_id, company_id, role) VALUES (?, ?, ?)',
      [result.id, companyResult.id, 'owner']
    );

    // Set as current company
    await dbRun(
      'UPDATE users SET current_company_id = ? WHERE id = ?',
      [companyResult.id, result.id]
    );

    res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        id: result.id,
        username,
        email,
        company_id: companyResult.id
      }
    });
  } catch (err) {
    if (err.message && (err.message.includes('duplicate key') || err.message.includes('UNIQUE constraint'))) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const passwordMatch = await bcryptjs.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({ 
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        hourly_rate: user.hourly_rate,
        pay_cycle: user.pay_cycle,
        profile_setup_complete: user.profile_setup_complete
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
