// controllers/AppController.js
import redisClient from '../utils/redis.js'; // Import Redis client
import dbClient from '../utils/db.js'; // Import DB client

const AppController = {
    // GET /status
    async getStatus(req, res) {
        try {
            const redisAlive = true; // Assume Redis is always alive for this example
            const dbAlive = dbClient.isAlive(); // Check DB connection

            res.status(200).json({
                redis: redisAlive,
                db: dbAlive
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    // GET /stats
    async getStats(req, res) {
        try {
            const usersCount = await dbClient.nbUsers(); // Get user count
            const filesCount = await dbClient.nbFiles(); // Get file count

            res.status(200).json({
                users: usersCount,
                files: filesCount
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

export default AppController;
