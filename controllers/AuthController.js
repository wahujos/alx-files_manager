import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(request, response) {
    const authHeader = request.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');

    if (!email || !password) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const hashedPassword = sha1(password);
    const users = dbClient.db.collection('users');

    try {
      const user = await users.findOne({ email, password: hashedPassword });
      if (!user) {
        return response.status(401).json({ error: 'Unauthorized' });
      }

      const token = uuidv4();
      const key = `auth_${token}`;
      await redisClient.set(key, user._id.toString(), 'EX', 60 * 60 * 24); // Set expiration to 24 hours
      response.status(200).json({ token });
    } catch (error) {
      console.error('Error during authentication:', error);
      response.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getDisconnect(request, response) {
    const token = request.header('X-Token');
    if (!token) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    try {
      const id = await redisClient.get(key);
      if (id) {
        await redisClient.del(key);
        response.status(204).send(); // No content
      } else {
        response.status(401).json({ error: 'Unauthorized' });
      }
    } catch (error) {
      console.error('Error during sign-out:', error);
      response.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default AuthController;
