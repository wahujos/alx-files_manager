// routes/index.js

import express from 'express';
import AuthController from '../controllers/AuthController.js';
import UsersController from '../controllers/UsersController.js';
import AppController from '../controllers/AppController.js'; // Make sure this is correct

const router = express.Router();

router.post('/users', UsersController.postNew);

// Add the new endpoints
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);

// Existing endpoint
router.get('/status', AppController.getStatus); // Ensure AppController is correctly imported and defined

export default router;
