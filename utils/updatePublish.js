import { ObjectID } from 'mongodb';
import dbClient from './db';
import authToken from './authToken';

// function that update publicity of document
async function updatePublish(req, res, state) {
  const user = await authToken(req, res);
  if ('error' in user) {
    return user;
  }
  const documentId = req.params.id;
  const searchCritria = { userId: ObjectID(user.id), _id: ObjectID(documentId) };
  const update = await dbClient.updateDocument(searchCritria, { $set: { isPublic: state } });
  if (update.matchedCount < 1) {
    return ({ error: 'Not found' });
  }
  const fileDocument = await dbClient.findOne('files', searchCritria);
  return ({
    id: documentId,
    userId: user.id,
    name: fileDocument.name,
    type: fileDocument.type,
    isPublic: fileDocument.isPublic,
    parentId: fileDocument.parentId.toString(),
  });
}

export default updatePublish;
