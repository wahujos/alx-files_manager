// utils/db.js

import { MongoClient } from 'mongodb';

// Use the connection string from environment variable
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/files_manager';

class DBClient {
  constructor() {
    this.client = new MongoClient(MONGO_URI, { useUnifiedTopology: true, useNewUrlParser: true });
    this.client.connect().then(() => {
      this.db = this.client.db(); // Use the database from the URI
    }).catch((err) => {
      console.error('Error connecting to MongoDB:', err);
    });
  }

  isAlive() {
    // Since `isConnected` is deprecated, use the alternative method
    return this.client.topology.isConnected();
  }

  async nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  async nbFiles() {
    return this.db.collection('files').countDocuments();
  }
}

// Create and export an instance of DBClient
const dbClient = new DBClient();
export default dbClient;
