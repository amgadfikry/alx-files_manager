import sha1 from 'sha1';
import { v4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

// class contain all functionality of routes manage authuntication process
class AuthController {
  // method that check if user if exist in data and generate tokens for it
  static async getConnect(req, res) {
    // check if there is authorization in request
    const authHeader = req.headers.authorization || null;
    if (!authHeader) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    // decode authorization header and extract email and password from it
    const decodedDetails = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
    const [email, password] = decodedDetails.split(':');
    if (!email || !password) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    // check if user exist or not in database
    const user = await dbClient.findOne('users', { email, password: sha1(password) });
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    // generate token and save it for redis as key with value of user id
    const token = v4();
    await redisClient.set(`auth_${token}`, user._id.toString(), 86400);
    res.status(200).json({ token });
  }

  // disconnect the user from database redis and remove it's token
  static async getDisconnect(req, res) {
    // retrieve token and get paired userId with it from redis
    const token = req.headers['x-token'] || null;
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
    } else {
      // delete token from database
      await redisClient.del(`auth_${token}`);
      res.sendStatus(204);
    }
  }
}

export default AuthController;
