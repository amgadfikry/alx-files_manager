import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

// start router of server contain routes
const router = express.Router();

// all get routes on app server
// route to manage get status of databases
router.get('/status', AppController.getStatus);
// route to get current state of files and users
router.get('/stats', AppController.getStats);
// route to authorize connect and generate token
router.get('/connect', AuthController.getConnect);
// route to sign out and remove generated token
router.get('/disconnect', AuthController.getDisconnect);
// route get user data based on token provided
router.get('/users/me', UsersController.getMe);

// all post routes on app server
// route to add new user to database
router.post('/users', UsersController.postNew);
// route to add new file, image, folder to database and local
router.post('/files', FilesController.postUpload);

export default router;