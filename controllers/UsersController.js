import crypto from 'crypto';
import dbClient from '../utils/db.js'; // Assuming you have this for DB access
import userQueue from '../worker.js'; // Import the Bull queue for user emails

const UsersController = {
  async postNew(req, res) {
    try {
      const { email, password } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Missing email' });
      }
      if (!password) {
        return res.status(400).json({ error: 'Missing password' });
      }

      const db = dbClient.db;
      const existingUser = await db.collection('users').findOne({ email });

      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
      const result = await db.collection('users').insertOne({ email, password: hashedPassword });
      const newUserId = result.insertedId;

      // Add a job to the userQueue to send a welcome email
      userQueue.add({ userId: newUserId });

      return res.status(201).json({ id: newUserId, email });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getMe(req, res) {
    try {
      // Implement the logic for GET /users/me
    } catch (error) {
      console.error('Error retrieving user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export default UsersController;
