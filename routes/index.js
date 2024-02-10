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
// route get specific document related to user and document id
router.get('/files/:id', FilesController.getShow);
// route paginate through all document or in specific folder related to specific user
router.get('/files', FilesController.getIndex);

// all post routes on app server
// route to add new user to database
router.post('/users', UsersController.postNew);
// route to add new file, image, folder to database and local
router.post('/files', FilesController.postUpload);

// all put routes on app server
// route update document to make it public
router.put('/files/:id/publish', FilesController.putPublish);
// route update document to make it unpublic
router.put('/files/:id/unpublish', FilesController.putUnpublish);

export default router;
