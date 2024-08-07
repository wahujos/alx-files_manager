import redisClient from '../utils/redis.js'; // Ensure the correct path
import dbClient from '../utils/db.js'; // Ensure the correct path

class AppController {
  static async getStatus(req, res) {
    try {
      const redisAlive = await redisClient.isAlive(); // Assuming isAlive returns a Promise
      const dbAlive = await dbClient.isAlive(); // Assuming isAlive returns a Promise
      res.status(200).json({ redis: redisAlive, db: dbAlive });
    } catch (error) {
      console.error('Error checking status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getStats(req, res) {
    try {
      const usersCount = await dbClient.nbUsers(); // Assuming nbUsers returns a Promise
      const filesCount = await dbClient.nbFiles(); // Assuming nbFiles returns a Promise
      res.status(200).json({ users: usersCount, files: filesCount });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default AppController;
