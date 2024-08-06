const request = require('supertest'); // Import supertest for HTTP assertions
const { expect } = require('chai'); // Import chai for assertions
const app = require('../server');  // Assuming you have an Express server in `server.js`

// Describe block for API endpoint tests
describe('API Endpoints', () => {
  // Test for GET /status endpoint
  describe('GET /status', () => {
    it('should return the status of the API', (done) => {
      request(app)
        .get('/status') // Send a GET request to /status endpoint
        .expect(200) // Expect the response status to be 200 (OK)
        .end((err, res) => { // Handle the response
          if (err) return done(err); // If there's an error, pass it to done
          // Check if the response body has properties 'redis' and 'db'
          expect(res.body).to.have.property('redis');
          expect(res.body).to.have.property('db');
          done(); // Complete the test
        });
    });
  });

  // Test for GET /stats endpoint
  describe('GET /stats', () => {
    it('should return statistics', (done) => {
      request(app)
        .get('/stats') // Send a GET request to /stats endpoint
        .expect(200) // Expect the response status to be 200 (OK)
        .end((err, res) => { // Handle the response
          if (err) return done(err); // If there's an error, pass it to done
          // Check if the response body has properties 'users' and 'files'
          expect(res.body).to.have.property('users');
          expect(res.body).to.have.property('files');
          done(); // Complete the test
        });
    });
  });

  // Test for POST /users endpoint
  describe('POST /users', () => {
    it('should create a new user', (done) => {
      request(app)
        .post('/users') // Send a POST request to /users endpoint
        .send({ email: 'test@example.com', password: 'password' }) // Send a request body with email and password
        .expect(201) // Expect the response status to be 201 (Created)
        .end((err, res) => { // Handle the response
          if (err) return done(err); // If there's an error, pass it to done
          // Check if the response body has properties 'id' and 'email'
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('email');
          done(); // Complete the test
        });
    });
  });

  // Test for GET /connect endpoint
  describe('GET /connect', () => {
    it('should log in a user', (done) => {
      request(app)
        .get('/connect') // Send a GET request to /connect endpoint
        .auth('test@example.com', 'password') // Authenticate with email and password
        .expect(200) // Expect the response status to be 200 (OK)
        .end((err, res) => { // Handle the response
          if (err) return done(err); // If there's an error, pass it to done
          // Check if the response body has a property 'token'
          expect(res.body).to.have.property('token');
          done(); // Complete the test
        });
    });
  });

  // Test for GET /disconnect endpoint
  describe('GET /disconnect', () => {
    it('should log out a user', (done) => {
      request(app)
        .get('/disconnect') // Send a GET request to /disconnect endpoint
        .set('X-Token', 'user_token') // Set the X-Token header for authentication
        .expect(204, done); // Expect the response status to be 204 (No Content) and complete the test
    });
  });

  // Test for GET /users/me endpoint
  describe('GET /users/me', () => {
    it('should return user details', (done) => {
      request(app)
        .get('/users/me') // Send a GET request to /users/me endpoint
        .set('X-Token', 'user_token') // Set the X-Token header for authentication
        .expect(200) // Expect the response status to be 200 (OK)
        .end((err, res) => { // Handle the response
          if (err) return done(err); // If there's an error, pass it to done
          // Check if the response body has properties 'id' and 'email'
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('email');
          done(); // Complete the test
        });
    });
  });

  // Test for POST /files endpoint
  describe('POST /files', () => {
    it('should upload a file', (done) => {
      request(app)
        .post('/files') // Send a POST request to /files endpoint
        .set('X-Token', 'user_token') // Set the X-Token header for authentication
        .send({ name: 'test.txt', type: 'file', data: 'dGVzdCBmaWxl' }) // Send file data in the request body
        .expect(201) // Expect the response status to be 201 (Created)
        .end((err, res) => { // Handle the response
          if (err) return done(err); // If there's an error, pass it to done
          // Check if the response body has properties 'id' and 'name'
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('name');
          done(); // Complete the test
        });
    });
  });

  // Test for GET /files/:id endpoint
  describe('GET /files/:id', () => {
    it('should return a file', (done) => {
      request(app)
        .get('/files/60a70f3e9a346a342b57f91d') // Send a GET request to /files/:id endpoint with a specific file ID
        .set('X-Token', 'user_token') // Set the X-Token header for authentication
        .expect(200) // Expect the response status to be 200 (OK)
        .end((err, res) => { // Handle the response
          if (err) return done(err); // If there's an error, pass it to done
          // Check if the response body has properties 'id' and 'name'
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('name');
          done(); // Complete the test
        });
    });
  });

  // Test for GET /files endpoint with pagination
  describe('GET /files', () => {
    it('should return a list of files with pagination', (done) => {
      request(app)
        .get('/files?page=0') // Send a GET request to /files endpoint with pagination query
        .set('X-Token', 'user_token') // Set the X-Token header for authentication
        .expect(200) // Expect the response status to be 200 (OK)
        .end((err, res) => { // Handle the response
          if (err) return done(err); // If there's an error, pass it to done
          expect(res.body).to.be.an('array'); // Check if the response body is an array
          done(); // Complete the test
        });
    });
  });

  // Test for PUT /files/:id/publish endpoint
  describe('PUT /files/:id/publish', () => {
    it('should publish a file', (done) => {
      request(app)
        .put('/files/60a70f3e9a346a342b57f91d/publish') // Send a PUT request to /files/:id/publish endpoint with a specific file ID
        .set('X-Token', 'user_token') // Set the X-Token header for authentication
        .expect(200) // Expect the response status to be 200 (OK)
        .end((err, res) => { // Handle the response
          if (err) return done(err); // If there's an error, pass it to done
          // Check if the response body has a property 'isPublic' set to true
          expect(res.body).to.have.property('isPublic', true);
          done(); // Complete the test
        });
    });
  });

  // Test for PUT /files/:id/unpublish endpoint
  describe('PUT /files/:id/unpublish', () => {
    it('should unpublish a file', (done) => {
      request(app)
        .put('/files/60a70f3e9a346a342b57f91d/unpublish') // Send a PUT request to /files/:id/unpublish endpoint with a specific file ID
        .set('X-Token', 'user_token') // Set the X-Token header for authentication
        .expect(200) // Expect the response status to be 200 (OK)
        .end((err, res) => { // Handle the response
          if (err) return done(err); // If there's an error, pass it to done
          // Check if the response body has a property 'isPublic' set to false
          expect(res.body).to.have.property('isPublic', false);
          done(); // Complete the test
        });
    });
  });

  // Test for GET /files/:id/data endpoint
  describe('GET /files/:id/data', () => {
    it('should return file data', (done) => {
      request(app)
        .get('/files/60a70f3e9a346a342b57f91d/data') // Send a GET request to /files/:id/data endpoint with a specific file ID
        .set('X-Token', 'user_token') // Set the X-Token header for authentication
        .expect(200) // Expect the response status to be 200 (OK)
        .end((err, res) => { // Handle the response
          if (err) return done(err); // If there's an error, pass it to done
          // Check if the Content-Type header is 'application/octet-stream'
          expect(res.headers['content-type']).to.equal('application/octet-stream');
          done(); // Complete the test
        });
    });
  });
});
