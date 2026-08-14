import mongoose from 'mongoose';
import { createApp } from './app.js';
import { env } from './config/env.js';

async function start(): Promise<void> {
  mongoose.set('strictQuery', false);

  await mongoose.connect(env.databaseUrl);
  console.log('Connected to database...');

  mongoose.connection.on('error', (error) => console.error(error));

  createApp().listen(env.port, () => console.log(`Server started at port ${env.port}`));
}

start().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
