// The Redis class

const { createClient } = require('redis');

class RedisClient {
  constructor() {
    this.client = createClient();
    // this.isConnected = true;
    this.isReady = false;

    this.client.on('error', (err) => {
      console.error(`Redis Error: ${err}`);
      this.isReady = false;
    });

    this.client.on('connect', () => {
      console.log('Connected to server');
      this.isReady = true;
    });
  }

  isAlive() {
    // if (this.client.connected) {
    //     return true;
    // } else {
    //     return false;
    // }

    // return this.client.connected;
    return this.isReady;
  }

  async get(key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, value) => {
        if (err) {
          reject(err);
        } else {
          resolve(value);
        }
      });
    });
  }

  async set(key, value, duration) {
    return new Promise((resolve, reject) => {
      this.client.setex(key, duration, value, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async del(key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
