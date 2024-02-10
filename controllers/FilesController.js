import { ObjectID } from 'mongodb';
import fs from 'fs';
import { v4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

// class contain all functionality of routes manage files process
class FilesController {
  static async postUpload(req, res) {
    // retain user document by token provided in request
    const token = req.headers['x-token'] || null;
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await dbClient.findOne('users', { _id: ObjectID(userId) });
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
    }
    // retrieve data from request body
    const {
      name,
      type,
      parentId = 0,
      isPublic = false,
      data = null,
    } = req.body;
    // check all possible error prevent from create new file
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }
    if (parentId) {
      const ParentFile = await dbClient.findOne('files', { _id: ObjectID(parentId) });
      if (!ParentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (ParentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    // create data of file and if it's folder save it to database
    let fileDetails = {
      userId, name, type, isPublic, parentId,
    };
    if (type === 'folder') {
      const addedFolder = await dbClient.addNew('files', fileDetails);
      return res.status(201).json({
        userId, name, type, isPublic, parentId, id: addedFolder.insertedId,
      });
    }
    // if it's file or image save it locally through provided path or default one
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const fileNameLocally = v4();
    const localPath = `${folderPath}/${fileNameLocally}`;
    fs.promises.mkdir(folderPath, { recursive: true })
      .then(() => {
        const fileContent = Buffer.from(data, 'base64').toString();
        return fs.promises.writeFile(localPath, fileContent);
      });
    // and save it on database
    fileDetails = { ...fileDetails, localPath };
    const addedFile = await dbClient.addNew('files', fileDetails);
    return res.status(201).json({
      userId, name, type, isPublic, parentId, localPath, id: addedFile.insertedId,
    });
  }
}

export default FilesController;
