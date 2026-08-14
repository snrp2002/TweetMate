/**
 * Starts the API against a throwaway in-memory MongoDB.
 *
 * Useful for local development and UI testing when you do not have a MongoDB
 * instance handy. Data is discarded when the process exits.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = await MongoMemoryServer.create();

process.env['DATABASE_URL'] = mongod.getUri('tweetmate');
process.env['JWT_SECRET'] ??= 'dev-only-insecure-secret';

console.log('Using in-memory MongoDB (data is not persisted)');

await import('../src/index.js');

const shutdown = async () => {
  await mongod.stop();
  process.exit(0);
};

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
