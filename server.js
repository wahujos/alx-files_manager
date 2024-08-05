i// Import the express library to create the server
import express from 'express';

// Import the router to handle the routes defined in routes/index.js
import router from './routes/index';

// Get the port from the environment variable PORT or use 5000 as the default port
const port = parseInt(process.env.PORT, 10) || 5000;

// Create an instance of an Express application
const app = express();

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// Use the imported router for handling routes starting from the root path ('/')
app.use('/', router);

// Start the server and listen on the specified port
app.listen(port, () => {
  // Log a message indicating that the server is running and on which port
  console.log(`Server running on port ${port}`);
});

// Export the app instance for potential testing or further configuration
export default app;
