// Import required modules and dependencies
const { v4: uuidv4 } = require('uuid'); // For generating unique file names
const mime = require('mime-types'); // To determine the MIME type of files
const fs = require('fs'); // File system module for interacting with the filesystem
const path = require('path'); // Utility for working with file and directory paths
const { ObjectId } = require('mongodb'); // For MongoDB ObjectId handling
const DBClient = require('../utils/db'); // Custom database client for MongoDB interaction
const fileQueue = require('../worker'); // Queue system for background file processing

// Directory where files will be stored
const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  // Handles file/folder upload
  static async postUpload(req, res) {
    const { userId } = req; // The userId from the request (assuming it's set by middleware)
    const { name, type, parentId = 0, isPublic = false, data } = req.body; // Extract relevant data from the request body

    // Validate input data
    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    // Check if the parent folder exists if a parentId is provided
    if (parentId !== 0) {
      const parentFile = await DBClient.db.collection('files').findOne({ _id: ObjectId(parentId), userId: ObjectId(userId) });
      if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    // Prepare file data object
    const fileData = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? '0' : ObjectId(parentId),
    };

    if (type === 'folder') {
      // For folder creation, simply insert the file data into the database
      const result = await DBClient.db.collection('files').insertOne(fileData);
      return res.status(201).json({ id: result.insertedId, ...fileData });
    } else {
      // For file or image, store the file on disk and record its path in the database
      const filePath = path.join(FOLDER_PATH, uuidv4()); // Generate a unique file path
      fs.mkdirSync(FOLDER_PATH, { recursive: true }); // Ensure the directory exists
      fs.writeFileSync(filePath, Buffer.from(data, 'base64')); // Write the file to disk

      fileData.localPath = filePath; // Store the file path in the file data

      const result = await DBClient.db.collection('files').insertOne(fileData); // Insert the file record into the database
      fileQueue.add({ userId, fileId: result.insertedId }); // Add the file to a queue for further processing (e.g., resizing)

      return res.status(201).json({ id: result.insertedId, ...fileData }); // Return the file information
    }
  }

  // Retrieves a single file/folder's metadata by ID
  static async getShow(req, res) {
    const { userId } = req;
    const { id } = req.params; // Extract the file ID from the request parameters

    const file = await DBClient.db.collection('files').findOne({ _id: ObjectId(id), userId: ObjectId(userId) }); // Fetch the file record
    if (!file) return res.status(404).json({ error: 'Not found' }); // If not found, return a 404 error

    res.status(200).json(file); // Return the file metadata
  }

  // Lists files/folders under a specific parent, with pagination
  static async getIndex(req, res) {
    const { userId } = req;
    const { parentId = 0, page = 0 } = req.query; // Extract the parentId and page number from query parameters

    // Query to filter files by userId and parentId
    const query = { userId: ObjectId(userId), parentId: parentId === 0 ? '0' : ObjectId(parentId) };
    const files = await DBClient.db.collection('files')
      .find(query)
      .skip(page * 20) // Implement pagination by skipping files
      .limit(20) // Limit results to 20 per page
      .toArray();

    res.status(200).json(files); // Return the list of files
  }

  // Publishes a file (makes it publicly accessible)
  static async putPublish(req, res) {
    const { userId } = req;
    const { id } = req.params;

    const file = await DBClient.db.collection('files').findOneAndUpdate(
      { _id: ObjectId(id), userId: ObjectId(userId) }, // Match the file by ID and userId
      { $set: { isPublic: true } }, // Set the isPublic field to true
      { returnOriginal: false } // Return the updated document
    );

    if (!file.value) return res.status(404).json({ error: 'Not found' }); // If the file is not found, return 404

    res.status(200).json(file.value); // Return the updated file metadata
  }

  // Unpublishes a file (makes it private)
  static async putUnpublish(req, res) {
    const { userId } = req;
    const { id } = req.params;

    const file = await DBClient.db.collection('files').findOneAndUpdate(
      { _id: ObjectId(id), userId: ObjectId(userId) }, // Match the file by ID and userId
      { $set: { isPublic: false } }, // Set the isPublic field to false
      { returnOriginal: false } // Return the updated document
    );

    if (!file.value) return res.status(404).json({ error: 'Not found' }); // If the file is not found, return 404

    res.status(200).json(file.value); // Return the updated file metadata
  }

  // Retrieves the content of a file
  static async getFile(req, res) {
    const { userId } = req;
    const { id } = req.params;
    const { size } = req.query; // Optionally, the client can request a specific size (for images)

    const file = await DBClient.db.collection('files').findOne({ _id: ObjectId(id) });

    if (!file || (file.isPublic === false && file.userId.toString() !== userId.toString())) {
      return res.status(404).json({ error: 'Not found' }); // If the file is not found or access is restricted, return 404
    }

    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" }); // Folders don't have downloadable content
    }

    let filePath = file.localPath;
    if (size) {
      filePath = `${filePath}_${size}`; // Modify the file path if a specific size is requested (for images)
    }

    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' }); // If the file doesn't exist on disk, return 404

    const mimeType = mime.lookup(file.name) || 'application/octet-stream'; // Determine the MIME type
    res.setHeader('Content-Type', mimeType); // Set the appropriate content type
    fs.createReadStream(filePath).pipe(res); // Stream the file content to the response
  }
}

// Export the FilesController class for use in other parts of the application
module.exports = FilesController;
