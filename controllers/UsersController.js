import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import Queue from 'bull';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

class UsersController {
  static async postNew(request, response) {
    const { email, password } = request.body;

    if (!email) {
      return response.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return response.status(400).json({ error: 'Missing password' });
    }

    try {
      const users = dbClient.db.collection('users');
      const userExists = await users.findOne({ email });

      if (userExists) {
        return response.status(400).json({ error: 'Already exist' });
      }

      const hashedPassword = sha1(password);
      const result = await users.insertOne({
        email,
        password: hashedPassword,
      });

      response.status(201).json({ id: result.insertedId, email });
      userQueue.add({ userId: result.insertedId });

    } catch (error) {
      console.error(error);
      response.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getMe(request, response) {
    const token = request.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const users = dbClient.db.collection('users');
      const user = await users.findOne({ _id: new ObjectId(userId) });

      if (user) {
        return response.status(200).json({ id: userId, email: user.email });
      } else {
        return response.status(401).json({ error: 'Unauthorized' });
      }
    } catch (error) {
      console.error(error);
      response.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default UsersController;
