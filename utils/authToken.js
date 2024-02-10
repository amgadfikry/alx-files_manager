import { ObjectID } from 'mongodb';
import redisClient from './redis';
import dbClient from './db';

// function that take token and return data of user if is authorized token
// or return object of error
// eslint-disable-next-line no-unused-vars
async function authToken(req, res) {
  const token = req.headers['x-token'] || null;
  if (!token) {
    return ({ error: 'Unauthorized' });
  }
  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) {
    return ({ error: 'Unauthorized' });
  }
  // retrive user from userId
  const user = await dbClient.findOne('users', { _id: ObjectID(userId) });
  if (!user) {
    return ({ error: 'Unauthorized' });
  }
  return ({ id: userId, email: user.email });
}

export default authToken;
