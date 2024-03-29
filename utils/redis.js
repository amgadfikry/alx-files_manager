import { createClient } from 'redis';
import { promisify } from 'util';

// class that represent connection with redis datatbase and it's methods to manage it
class RedisClient {
  // start class with instance with start connection without ant error
  constructor() {
    this.client = createClient();
    this.connection = true;
    this.client.on('error', (err) => {
      console.log(`Redis client error: ${err}`);
      this.connection = false;
    });
    this.client.on('connect', () => {
      this.connection = true;
    });
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  // method that check if connection with redis is still stablish
  isAlive() {
    return this.connection;
  }

  // get vaue of provided key async way from database
  async get(key) {
    const value = await this.getAsync(key);
    return value;
  }

  // set new key, value pair in database with specific TTL async way
  async set(key, value, duration) {
    await this.setAsync(key, value, 'EX', duration);
  }

  // delete provided key from database in async way
  async del(key) {
    await this.delAsync(key);
  }
}

// create new instance of class and export it by default
const redisClient = new RedisClient();
export default redisClient;
