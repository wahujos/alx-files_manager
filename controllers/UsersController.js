import sha1 from 'sha1';
import { ObjectId } from 'mongodb'; // Correctly import ObjectId
import Queue from 'bull';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

// Create a Bull queue for handling user-related tasks
const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

class UsersController {
  // POST /users endpoint to create a new user
  static postNew(request, response) {
    const { email, password } = request.body;

    // Check if the email is provided
    if (!email) {
      return response.status(400).json({ error: 'Missing email' });
    }
    // Check if the password is provided
    if (!password) {
      return response.status(400).json({ error: 'Missing password' });
    }

    const users = dbClient.db.collection('users');

    // Check if the email already exists in the database
    users.findOne({ email }, (err, user) => {
      if (err) {
        // Handle errors that occur during the database query
        console.log(err);
        return response.status(500).json({ error: 'Internal server error' });
      }

      if (user) {
        // If the email already exists, return an error
        return response.status(400).json({ error: 'Already exist' });
      }

      // Hash the password using SHA1
      const hashedPassword = sha1(password);

      // Insert the new user into the database
      users.insertOne({ email, password: hashedPassword })
        .then((result) => {
          // Respond with the new user details and status 201 Created
          response.status(201).json({ id: result.insertedId, email });
          // Add a job to the queue for further processing
          userQueue.add({ userId: result.insertedId });
        })
        .catch((error) => {
          // Handle errors that occur during insertion
          console.log(error);
          response.status(500).json({ error: 'Internal server error' });
        });
    });
  }

  // GET /me endpoint to get the currently authenticated user
  static async getMe(request, response) {
    // Retrieve the token from the request header
    const token = request.header('X-Token');
    if (!token) {
      // Return an error if no token is provided
      return response.status(401).json({ error: 'Unauthorized' });
    }

    // Construct the Redis key for the token
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (userId) {
      const users = dbClient.db.collection('users');
      // Convert the userId to ObjectId format
      const idObject = new ObjectId(userId);

      // Find the user in the database
      users.findOne({ _id: idObject }, (err, user) => {
        if (err) {
          // Handle errors that occur during the database query
          console.log(err);
          return response.status(500).json({ error: 'Internal server error' });
        }
        
        if (user) {
          // Respond with the user's details and status 200 OK
          return response.status(200).json({ id: userId, email: user.email });
        } else {
          // Return an error if the user is not found
          return response.status(401).json({ error: 'Unauthorized' });
        }
      });
    } else {
      // Handle case where the token is not found in Redis
      console.log('Token not found in Redis!');
      return response.status(401).json({ error: 'Unauthorized' });
    }
  }
}

export default UsersController;
