import crypto from 'crypto';
import { MongoClient } from 'mongodb';
import { getDB } from '../utils/db';  // Adjust the path if necessary

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      const db = await getDB();
      const usersCollection = db.collection('users');

      // Check if email already exists
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      // Hash the password using SHA1
      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

      // Create the new user
      const result = await usersCollection.insertOne({ email, password: hashedPassword });

      // Respond with the new user data
      const newUser = result.ops[0];
      return res.status(201).json({ id: newUser._id, email: newUser.email });

    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default UsersController;
