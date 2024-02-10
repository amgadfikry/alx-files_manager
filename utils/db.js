import { MongoClient } from 'mongodb';

// create class that connect to mongodb and mange it
class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const dbName = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}/${dbName}`;
    MongoClient.connect(url, (err, db) => {
      if (err) {
        console.log(`Can't connect to database: ${err}`);
      }
      this.client = db;
      this.db = db.db(dbName);
    });
  }

  // check if connect to database or not
  isAlive() {
    return !!this.db;
  }

  // get users count documents in users collection
  async nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  // get files count documents in files collection
  async nbFiles() {
    return this.db.collection('files').countDocuments();
  }

  // find document in provided collection name with provided detail object
  async findOne(coll, obj) {
    return this.db.collection(coll).findOne(obj);
  }

  // add new document to provided collection name with provided data
  async addNew(coll, data) {
    return this.db.collection(coll).insertOne(data);
  }

  // paginate through files with specific critria, page number zero index, and page size
  async paginationFiles(critria, page, pageSize) {
    const pipline = [
      { $match: critria },
      { $skip: (page * pageSize) },
      { $limit: pageSize },
    ];
    return this.db.collection('files').aggregate(pipline).toArray();
  }
}

// create new instance of class and export it
const dbClient = new DBClient();
export default dbClient;
