const { expect } = require('chai');
const redisClient = require('../utils/redis');

describe('redisClient', () => {
  before((done) => {
    redisClient.client.on('connect', done);
  });

  it('should connect to Redis server', () => {
    expect(redisClient.isAlive()).to.be.true;
  });

  it('should set and get a key', async () => {
    await redisClient.set('test_key', 'test_value', 10);
    const value = await redisClient.get('test_key');
    expect(value).to.equal('test_value');
  });

  it('should delete a key', async () => {
    await redisClient.del('test_key');
    const value = await redisClient.get('test_key');
    expect(value).to.be.null;
  });
});
