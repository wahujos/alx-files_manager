// utils/db.js

import { MongoClient } from 'mongodb';

// Use the connection string from the environment variable
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/files_manager';

class DBClient {
  constructor() {
    this.client = new MongoClient(MONGO_URI, { useUnifiedTopology: true, useNewUrlParser: true });
    this.client.connect().then(() => {
      this.db = this.client.db(); // Use the database from the URI
      console.log('Connected to MongoDB');
    }).catch((err) => {
      console.error('Error connecting to MongoDB:', err);
    });
  }

  // Check if MongoDB is alive by pinging the server
  async isAlive() {
    try {
      await this.db.command({ ping: 1 });
      return true;
    } catch (err) {
      console.error('MongoDB is not alive:', err);
      return false;
    }
  }

  async nbUsers() {
    try {
      return await this.db.collection('users').countDocuments();
    } catch (err) {
      console.error('Error counting users:', err);
      return 0;
    }
  }

  async nbFiles() {
    try {
      return await this.db.collection('files').countDocuments();
    } catch (err) {
      console.error('Error counting files:', err);
      return 0;
    }
  }
}

// Create and export an instance of DBClient
const dbClient = new DBClient();
export default dbClient;
