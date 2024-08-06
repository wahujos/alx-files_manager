import express from 'express';
import AuthController from '../controllers/AuthController.js';
import UsersController from '../controllers/UsersController.js';
import AppController from '../controllers/AppController.js';
import FilesController from '../controllers/FilesController.js'; // Import FilesController

const router = express.Router();

// User-related endpoints
router.post('/users', UsersController.postNew);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);

// App status endpoint
router.get('/status', AppController.getStatus);

// File manager endpoints
router.post('/files', FilesController.postUpload);
router.get('/files/:id', FilesController.getShow);
router.get('/files', FilesController.getIndex);
router.put('/files/:id/publish', FilesController.putPublish);
router.put('/files/:id/unpublish', FilesController.putUnpublish);
router.get('/files/:id/data', FilesController.getFile);

export default router;
