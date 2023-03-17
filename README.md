# Folder-DB-Sync

Folder-DB-Sync is a Node.js script that watches and synchronizes JSON files in multiple folders with a MongoDB database. When a file is added, modified, or deleted, the script updates the corresponding MongoDB collection accordingly.

## Features

- Watches multiple folders with JSON files
- Synchronizes JSON files with MongoDB collections
- Inserts the MongoDB `_id` field back into the JSON files
- Supports adding, modifying, and deleting files

## Requirements

- Node.js
- MongoDB

## Installation

1. Clone the repository:
`https://github.com/stevelab1/folder-db-sync`

2. Navigate to the project folder:
`cd folder-db-sync`

3. Install dependencies:
`npm i`

4. Create a `.env.local` file in the project root and set your `MONGODB_URI` environment variable

## Usage

1. Run the script: `npm run watch-folder`

2. The script will watch the specified folders in the `data` directory and sync them with the MongoDB collections.

3. Add, modify, or delete JSON files in the watched folders to see the changes reflected in the MongoDB collections.

## License

Pending
