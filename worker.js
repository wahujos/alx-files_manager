import Queue from 'bull';
import imageThumbnail from 'image-thumbnail';
import { promises as fs } from 'fs';
import { ObjectId } from 'mongodb';
import dbClient from './utils/db';

const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');
const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

async function thumbNail(width, localPath) {
  try {
    return await imageThumbnail(localPath, { width });
  } catch (error) {
    throw new Error(`Thumbnail generation failed for width ${width}: ${error.message}`);
  }
}

// Process fileQueue
fileQueue.process(async (job, done) => {
  console.log('Processing file queue...');
  const { fileId, userId } = job.data;

  if (!fileId) return done(new Error('Missing fileId'));
  if (!userId) return done(new Error('Missing userId'));

  try {
    const files = dbClient.db.collection('files');
    const file = await files.findOne({ _id: new ObjectId(fileId) });

    if (!file) return done(new Error('File not found'));

    const fileName = file.localPath;
    const thumbnail500 = await thumbNail(500, fileName);
    const thumbnail250 = await thumbNail(250, fileName);
    const thumbnail100 = await thumbNail(100, fileName);

    console.log('Writing thumbnails to system...');
    const image500 = `${fileName}_500`;
    const image250 = `${fileName}_250`;
    const image100 = `${fileName}_100`;

    await fs.writeFile(image500, thumbnail500);
    await fs.writeFile(image250, thumbnail250);
    await fs.writeFile(image100, thumbnail100);

    done();
  } catch (error) {
    console.error('Error processing file queue:', error);
    done(error);
  }
});

// Process userQueue
userQueue.process(async (job, done) => {
  console.log('Processing user queue...');
  const { userId } = job.data;

  if (!userId) return done(new Error('Missing userId'));

  try {
    const users = dbClient.db.collection('users');
    const user = await users.findOne({ _id: new ObjectId(userId) });

    if (user) {
      console.log(`Welcome ${user.email}!`);
      // Here you could also send a welcome email if configured
    } else {
      return done(new Error('User not found'));
    }

    done();
  } catch (error) {
    console.error('Error processing user queue:', error);
    done(error);
  }
});

// Handle queue errors
fileQueue.on('error', (error) => {
  console.error('File queue error:', error);
});

userQueue.on('error', (error) => {
  console.error('User queue error:', error);
});

