import sha1 from 'sha1'; // Import SHA1 hashing function
import { v4 as uuidv4 } from 'uuid'; // Import UUID generation function
import dbClient from '../utils/db'; // Import the database client
import redisClient from '../utils/redis'; // Import the Redis client

class AuthController {
  // Handles user login and token generation
  static async getConnect(request, response) {
    // Get the Authorization header value
    const authData = request.header('Authorization');
    
    // Decode the Base64 encoded credentials
    let userEmail = authData.split(' ')[1]; // Extract credentials part
    const buff = Buffer.from(userEmail, 'base64'); // Decode Base64
    userEmail = buff.toString('ascii'); // Convert to ASCII string
    
    // Split the email and password
    const data = userEmail.split(':'); // Contains email and password
    if (data.length !== 2) { // Check for valid credentials
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const hashedPassword = sha1(data[1]); // Hash the password
    const users = dbClient.db.collection('users'); // Access the users collection
    users.findOne({ email: data[0], password: hashedPassword }, async (err, user) => {
      if (user) { // If user is found
        const token = uuidv4(); // Generate a new token
        const key = `auth_${token}`; // Key for Redis
        await redisClient.set(key, user._id.toString(), 60 * 60 * 24); // Store user ID in Redis for 24 hours
        response.status(200).json({ token }); // Respond with token
      } else { // If user is not found
        response.status(401).json({ error: 'Unauthorized' });
      }
    });
  }

  // Handles user logout and token invalidation
  static async getDisconnect(request, response) {
    const token = request.header('X-Token'); // Get the token from header
    const key = `auth_${token}`; // Key for Redis
    const id = await redisClient.get(key); // Retrieve user ID from Redis
    if (id) { // If token is valid
      await redisClient.del(key); // Delete token from Redis
      response.status(204).json({}); // Respond with no content
    } else { // If token is not found
      response.status(401).json({ error: 'Unauthorized' });
    }
  }
}

module.exports = AuthController; // Export the controller
