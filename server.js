import express from 'express';
import router from './routes/index';

// define express app entry
const app = express();

// define listen port if in ENV or use default one
const port = parseInt(process.env.PORT, 10) || 5000;

// use middleware to get json data from request body
app.use(express.json());

// use all routes provided in router
app.use('/', router);

// start listen app with ready message
app.listen(port, () => console.log('Server is ready'));
