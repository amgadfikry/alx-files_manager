import sha1 from 'sha1';
import { ObjectID } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

// class contain all functionality of routes manage users
class UsersController {
  // method that add new user to users collections in databse
  static async postNew(req, res) {
    const { email, password } = req.body;
    // check if email is missing or not
    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }
    // check if password is missing or not
    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }
    // check if there exist email in database
    const user = await dbClient.findOne('users', { email });
    if (user) {
      res.status(400).json({ error: 'Already exist' });
      return;
    }
    // hash password using sh1 encreption
    const hashedPassword = sha1(password);
    const data = { email, password: hashedPassword };
    // add new user to database
    const addedUser = await dbClient.addNew('users', data);
    res.status(201).json({ id: addedUser.insertedId, email });
  }

  // method that retrieve user data based on token
  static async getMe(req, res) {
    // retrieve token and get paired userId with it from redis
    const token = req.headers['X-Token'];
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    // retrive user from userId
    const user = await dbClient.findOne('users', { _id: ObjectID(userId) });
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
    }
    res.status(200).json({ id: userId, email: user.email });
  }
}

export default UsersController;
