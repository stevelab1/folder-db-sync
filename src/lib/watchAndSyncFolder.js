import { MongoClient } from 'mongodb';
import chokidar from 'chokidar';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    "MONGODB_URI environment variable not set. Please set it before running the script."
  );
}

const client = new MongoClient(uri);

async function connectToDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error(error);
  }
}

async function disconnectFromDB() {
  try {
    await client.close();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error(error);
  }
}

async function syncFileToDB(filePath, collectionName) {
  try {
    const contents = await fs.readFile(filePath, 'utf-8');
    const document = JSON.parse(contents);

    // perform validation as needed

    const fileName = path.basename(filePath, '.json');
    const updateResult = await client
      .db('ai_android_stories')
      .collection(collectionName)
      .updateOne({ fileName }, { $set: document }, { upsert: true });
    console.log(`Updated ${fileName} in MongoDB. Matched count: ${updateResult.matchedCount}, Modified count: ${updateResult.modifiedCount}`);

    if (!document._id && updateResult.upsertedId) {
      document._id = updateResult.upsertedId._id;
      await fs.writeFile(filePath, JSON.stringify(document, null, 2), 'utf-8');
      console.log(`Updated JSON file with _id: ${document._id}`);
    }
  } catch (error) {
    console.error(`Error syncing ${filePath}:`, error);
  }
}

async function watchFolder(folderPath, collectionName) {
  const watcher = chokidar.watch(folderPath, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles and hidden files
    persistent: true,
  });

  watcher
    .on("add", (filePath) => syncFileToDB(filePath, collectionName))
    .on("change", (filePath) => syncFileToDB(filePath, collectionName))
    .on("unlink", async (filePath) => {
      try {
        const fileName = path.basename(filePath, ".json");
        await client.db().collection(collectionName).deleteOne({ fileName });
        console.log(`Deleted ${fileName} from MongoDB`);
      } catch (error) {
        console.error(`Error deleting ${filePath}:`, error);
      }
    });

  await connectToDB();

  // Wait for the 'ready' event before disconnecting from the database
  return new Promise((resolve) => {
    watcher.on("ready", () => {
      console.log("Chokidar is ready to watch files");
      resolve();
    });
  });
}

async function main() {
  const folderPath = path.join(__dirname, "..", "data", "characters");
  await watchFolder(folderPath, "characters");
}

main().catch((error) => {
  console.error(error);
  disconnectFromDB().finally(() => {
    process.exit(1);
  });
});

process.on("SIGINT", async () => {
  console.log("Received SIGINT. Closing MongoDB connection and exiting.");
  await disconnectFromDB();
  process.exit(0);
});
