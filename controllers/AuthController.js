// controllers/AuthController.js

import crypto from 'crypto';
import redisClient from '../utils/redis.js'; // Adjust path if needed
import dbClient from '../utils/db.js'; // Adjust path if needed
import { v4 as uuidv4 } from 'uuid';

const AuthController = {
  async getConnect(req, res) {
    try {
      // Extract credentials from the Authorization header
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Basic ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii').split(':');
      const email = credentials[0];
      const password = credentials[1];

      if (!email || !password) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Hash the password
      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
      const db = dbClient.db;
      const user = await db.collection('users').findOne({ email, password: hashedPassword });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Generate a new token
      const token = uuidv4();
      const key = `auth_${token}`;

      // Store the token in Redis
      await redisClient.setEx(key, 24 * 60 * 60, user._id.toString());

      return res.status(200).json({ token });
    } catch (error) {
      console.error('Error connecting user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getDisconnect(req, res) {
    try {
      // Extract token from the header
      const token = req.headers['x-token'];
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const key = `auth_${token}`;
      const userId = await redisClient.get(key);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Delete the token from Redis
      await redisClient.del(key);
      return res.status(204).send();
    } catch (error) {
      console.error('Error disconnecting user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export default AuthController;
