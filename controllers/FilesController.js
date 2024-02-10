import { ObjectID } from 'mongodb';
import fs from 'fs';
import { v4 } from 'uuid';
import mime from 'mime-types';
import dbClient from '../utils/db';
import authToken from '../utils/authToken';
import updatePublish from '../utils/updatePublish';

// class contain all functionality of routes manage files process
class FilesController {
  static async postUpload(req, res) {
    // retain user document by token provided in request
    const user = await authToken(req, res);
    if ('error' in user) {
      return res.status(401).json(user);
    }
    const userId = user.id;

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
      userId: ObjectID(userId),
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? 0 : ObjectID(parentId),
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

  // method that show specific file with provided id and token of user
  static async getShow(req, res) {
    const user = await authToken(req, res);
    if ('error' in user) {
      return res.status(401).json(user);
    }
    const documentId = req.params.id;
    const searchCritria = { userId: ObjectID(user.id), _id: ObjectID(documentId) };
    const fileDocument = await dbClient.findOne('files', searchCritria);
    if (!fileDocument) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({
      id: documentId,
      userId: user.id,
      name: fileDocument.name,
      type: fileDocument.type,
      isPublic: fileDocument.isPublic,
      parentId: fileDocument.parentId.toString(),
    });
  }

  // method that paginate through document related specific folder and user
  static async getIndex(req, res) {
    const user = await authToken(req, res);
    if ('error' in user) {
      return res.status(401).json(user);
    }
    const { parentId = 0, page = 0 } = req.query;
    const searchCritria = parentId === 0 ? {} : { parentId: ObjectID(parentId) };
    const documentList = await dbClient.paginationFiles(searchCritria, page, 20);
    const result = [];
    documentList.forEach((li) => {
      result.push({
        id: li._id.toString(),
        userId: user.id,
        name: li.name,
        type: li.type,
        isPublic: li.isPublic,
        parentId: li.parentId.toString(),
      });
    });
    return res.status(200).json(result);
  }

  // method that update document to make it public
  static async putPublish(req, res) {
    const result = await updatePublish(req, res, true);
    if ('error' in result) {
      if (result.error === 'Unauthorized') return res.status(401).json(result);
      return res.status(404).json(result);
    }
    return res.status(200).json(result);
  }

  // method that update document to make it unpublic
  static async putUnpublish(req, res) {
    const result = await updatePublish(req, res, false);
    if ('error' in result) {
      if (result.error === 'Unauthorized') return res.status(401).json(result);
      return res.status(404).json(result);
    }
    return res.status(200).json(result);
  }

  // method that get content of file accord it's id provided
  static async getFile(req, res) {
    const user = await authToken(req, res);
    const documentId = req.params.id;
    const searchCritria = { _id: ObjectID(documentId) };
    const fileDocument = await dbClient.findOne('files', searchCritria);
    if (!fileDocument) {
      return res.status(404).json({ error: 'Not found' });
    }
    if (!fileDocument.isPublic) {
      if ('error' in user) {
        return res.status(404).json({ error: 'Not found' });
      }
      if (user.id !== fileDocument.userId.toString()) {
        return res.status(404).json({ error: 'Not found' });
      }
    }
    if (fileDocument.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }
    try {
      await fs.promises.access(fileDocument.localPath);
      const content = await fs.promises.readFile(fileDocument.localPath, 'utf-8');
      const mimeType = mime.lookup(fileDocument.localPath);
      res.setHeader('Content-Type', mimeType);
      return res.end(content);
    } catch (err) {
      return res.status(404).json({ error: 'Not found' });
    }
  }
}

export default FilesController;
