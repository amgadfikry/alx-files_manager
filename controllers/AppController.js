import redisClient from '../utils/redis';
import dbClient from '../utils/db';

// class contain all functionality of routes manage app state
class AppController {
  // method that show state of connection to both database (redis, mongodb)
  static getStatus(req, res) {
    if (redisClient.isAlive() && dbClient.isAlive()) {
      res.status(200);
      res.json({ redis: true, db: true });
    }
  }

  // method that show state of files and users in database
  static async getStats(req, res) {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();
    const data = { users, files };
    res.status(200);
    res.json(data);
  }
}

export default AppController;
