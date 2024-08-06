import express from 'express';
import AuthController from '../controllers/AuthController.js';
import UsersController from '../controllers/UsersController.js';
import AppController from '../controllers/AppController.js'; // Ensure this is correctly defined and imported

const router = express.Router();

// Route for creating a new user
router.post('/users', UsersController.postNew);

// Routes for authentication
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);

// Routes for checking API status and stats
router.get('/status', AppController.getStatus); // Ensure AppController is correctly imported and defined
router.get('/stats', AppController.getStats);   // Adding the /stats route

export default router;
