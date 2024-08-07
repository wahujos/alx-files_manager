import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController'; // Add this if you have file-related routes

const router = express.Router();

// Existing routes
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

// New routes
router.post('/users', UsersController.postNew); // Create a new user

router.get('/connect', AuthController.getConnect); // Sign-in and generate a token
router.get('/disconnect', AuthController.getDisconnect); // Sign-out and invalidate the token

router.get('/users/me', UsersController.getMe); // Retrieve user based on token

// Additional routes for file operations
router.post('/files', FilesController.postUpload); // Upload a file
router.get('/files/:id', FilesController.getShow); // Get a specific file by ID
router.get('/files', FilesController.getIndex); // List all files
router.put('/files/:id/publish', FilesController.putPublish); // Publish a file
router.put('/files/:id/unpublish', FilesController.putUnpublish); // Unpublish a file
router.get('/files/:id/data', FilesController.getFile); // Get file data

export default router;
