import sha1 from 'sha1';
import dbClient from '../utils/db';
import authToken from '../utils/authToken';

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
    const user = await authToken(req, res);
    if ('error' in user) {
      return res.status(401).json(user);
    }
    return res.status(200).json(user);
  }
}

export default UsersController;
