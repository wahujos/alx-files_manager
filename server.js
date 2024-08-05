// server.js
import express from 'express';
import routes from './routes/index.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware to parse JSON requests
app.use(express.json());

// Load all routes
app.use('/api', routes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
