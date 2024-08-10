import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import { ObjectID } from 'mongodb';
import mime from 'mime-types';
import Queue from 'bull';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');

class FilesController {
  static async getUser(request) {
    const token = request.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (userId) {
      const users = dbClient.db.collection('users');
      const idObject = new ObjectID(userId);
      const user = await users.findOne({ _id: idObject });
      if (!user) {
        return null;
      }
      return user;
    }
    return null;
  }

  static async postUpload(request, response) {
    const user = await FilesController.getUser(request);
    if (!user) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name, type, parentId, isPublic = false, data,
    } = request.body;

    if (!name) {
      return response.status(400).json({ error: 'Missing name' });
    }
    if (!type) {
      return response.status(400).json({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) {
      return response.status(400).json({ error: 'Missing data' });
    }

    const files = dbClient.db.collection('files');
    if (parentId) {
      const idObject = new ObjectID(parentId);
      const file = await files.findOne({ _id: idObject, userId: user._id });
      if (!file) {
        return response.status(400).json({ error: 'Parent not found' });
      }
      if (file.type !== 'folder') {
        return response.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    try {
      if (type === 'folder') {
        const result = await files.insertOne({
          userId: user._id,
          name,
          type,
          parentId: parentId || 0,
          isPublic,
        });
        return response.status(201).json({
          id: result.insertedId,
          userId: user._id,
          name,
          type,
          isPublic,
          parentId: parentId || 0,
        });
      }
      const filePath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const fileName = `${filePath}/${uuidv4()}`;
      const buff = Buffer.from(data, 'base64');

      try {
        await fs.mkdir(filePath, { recursive: true });
        await fs.writeFile(fileName, buff);
      } catch (error) {
        console.error('Error writing file:', error);
        return response.status(500).json({ error: 'Internal server error' });
      }

      const result = await files.insertOne({
        userId: user._id,
        name,
        type,
        isPublic,
        parentId: parentId || 0,
        localPath: fileName,
      });

      if (type === 'image') {
        fileQueue.add({
          userId: user._id,
          fileId: result.insertedId,
        });
      }

      return response.status(201).json({
        id: result.insertedId,
        userId: user._id,
        name,
        type,
        isPublic,
        parentId: parentId || 0,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      return response.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getShow(request, response) {
    const user = await FilesController.getUser(request);
    if (!user) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = request.params.id;
    const files = dbClient.db.collection('files');
    const idObject = new ObjectID(fileId);

    try {
      const file = await files.findOne({ _id: idObject, userId: user._id });
      if (!file) {
        return response.status(404).json({ error: 'Not found' });
      }
      return response.status(200).json(file);
    } catch (error) {
      console.error('Error fetching file:', error);
      return response.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getIndex(request, response) {
    const user = await FilesController.getUser(request);
    if (!user) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const { parentId, page = 0 } = request.query;
    const files = dbClient.db.collection('files');
    const query = parentId
      ? { userId: user._id, parentId: ObjectID(parentId) }
      : { userId: user._id };

    try {
      const result = await files.aggregate([
        { $match: query },
        { $sort: { _id: -1 } },
        {
          $facet: {
            metadata: [
              { $count: 'total' },
              { $addFields: { page: parseInt(page, 10) } },
            ],
            data: [
              { $skip: 20 * parseInt(page, 10) },
              { $limit: 20 },
            ],
          },
        },
      ]).toArray();

      const final = result[0].data.map((file) => {
        const tmpFile = { ...file, id: file._id };
        delete tmpFile._id;
        delete tmpFile.localPath;
        return tmpFile;
      });

      return response.status(200).json(final);
    } catch (error) {
      console.error('Error fetching files:', error);
      return response.status(500).json({ error: 'Internal server error' });
    }
  }

  static async putPublish(request, response) {
    const user = await FilesController.getUser(request);
    if (!user) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = request.params;
    const files = dbClient.db.collection('files');
    const idObject = new ObjectID(id);

    try {
      const file = await files.findOneAndUpdate(
        { _id: idObject, userId: user._id },
        { $set: { isPublic: true } },
        { returnOriginal: false },
      );
      if (!file.value) {
        return response.status(404).json({ error: 'Not found' });
      }
      return response.status(200).json(file.value);
    } catch (error) {
      console.error('Error updating file visibility:', error);
      return response.status(500).json({ error: 'Internal server error' });
    }
  }

  static async putUnpublish(request, response) {
    const user = await FilesController.getUser(request);
    if (!user) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = request.params;
    const files = dbClient.db.collection('files');
    const idObject = new ObjectID(id);

    try {
      const file = await files.findOneAndUpdate(
        { _id: idObject, userId: user._id },
        { $set: { isPublic: false } },
        { returnOriginal: false },
      );
      if (!file.value) {
        return response.status(404).json({ error: 'Not found' });
      }
      return response.status(200).json(file.value);
    } catch (error) {
      console.error('Error updating file visibility:', error);
      return response.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getFile(request, response) {
    const { id } = request.params;
    const files = dbClient.db.collection('files');
    const idObject = new ObjectID(id);

    try {
      const file = await files.findOne({ _id: idObject });
      if (!file) {
        return response.status(404).json({ error: 'Not found' });
      }

      if (file.isPublic) {
        if (file.type === 'folder') {
          return response.status(400).json({ error: "A folder doesn't have content" });
        }

        let fileName = file.localPath;
        const { size } = request.query;
        if (size) {
          fileName = `${file.localPath}_${size}`;
        }
        const data = await fs.readFile(fileName);
        const contentType = mime.contentType(file.name);
        return response.header('Content-Type', contentType).status(200).send(data);
      }
      const user = await FilesController.getUser(request);
      if (!user) {
        return response.status(404).json({ error: 'Not found' });
      }
      if (file.userId.toString() === user._id.toString()) {
        if (file.type === 'folder') {
          return response.status(400).json({ error: "A folder doesn't have content" });
        }

        let fileName = file.localPath;
        const { size } = request.query;
        if (size) {
          fileName = `${file.localPath}_${size}`;
        }
        const data = await fs.readFile(fileName);
        const contentType = mime.contentType(file.name);
        return response.header('Content-Type', contentType).status(200).send(data);
      }
      return response.status(404).json({ error: 'Not found' });
    } catch (error) {
      console.error('Error fetching file:', error);
      return response.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default FilesController;
