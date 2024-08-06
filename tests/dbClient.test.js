const { expect } = require('chai');
const dbClient = require('../utils/db');

describe('dbClient', () => {
  before((done) => {
    dbClient.client.connect(done);
  });

  it('should connect to MongoDB server', () => {
    expect(dbClient.isAlive()).to.be.true;
  });

  it('should return the number of users in the users collection', async () => {
    const usersCount = await dbClient.nbUsers();
    expect(usersCount).to.be.a('number');
  });

  it('should return the number of files in the files collection', async () => {
    const filesCount = await dbClient.nbFiles();
    expect(filesCount).to.be.a('number');
  });
});
