// routes/index.js

import express from 'express';
import UsersController from '../controllers/UsersController.js';
import AuthController from '../controllers/AuthController.js';
// Import other necessary controllers

const router = express.Router();

// Existing routes
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

// New routes
router.post('/users', UsersController.postNew);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);

export default router;
