/**
 * Moves inline base64 images out of MongoDB and into Cloudinary.
 *
 * Idempotent: documents whose image is already a URL are skipped, so it is safe
 * to re-run after a partial failure. Dry run by default.
 *
 *   npm run migrate:images           # report only
 *   npm run migrate:images -- --apply
 */
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { Post } from '../src/models/posts.js';
import { User } from '../src/models/user.js';
import {
  AVATARS_FOLDER,
  POSTS_FOLDER,
  isRemoteImage,
  isStorageConfigured,
  uploadFromServer,
} from '../src/lib/storage.js';

const APPLY = process.argv.includes('--apply');

function mb(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

/** Approximate decoded size of a base64 data URL. */
function decodedBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  return comma === -1 ? 0 : Math.floor((dataUrl.length - comma - 1) * 0.75);
}

interface Row {
  id: string;
  image: string;
}

async function migrate(
  label: string,
  rows: Row[],
  folder: string,
  save: (id: string, url: string) => Promise<unknown>,
): Promise<{ moved: number; skipped: number; failed: number; bytes: number }> {
  console.log(`\n${label}`);
  let moved = 0;
  let skipped = 0;
  let failed = 0;
  let bytes = 0;

  for (const row of rows) {
    if (isRemoteImage(row.image)) {
      skipped++;
      continue;
    }
    if (!row.image.startsWith('data:')) {
      skipped++;
      continue;
    }

    const size = decodedBytes(row.image);
    bytes += size;

    if (!APPLY) {
      console.log(`  ${row.id}  would upload ${mb(size)}`);
      moved++;
      continue;
    }

    try {
      // Cloudinary accepts the data URI as-is, so no decoding is needed.
      const url = await uploadFromServer(row.image, folder);
      await save(row.id, url);
      console.log(`  ${row.id}  moved ${mb(size)} -> ${url}`);
      moved++;
    } catch (error) {
      console.error(`  ${row.id}  FAILED: ${(error as Error).message}`);
      failed++;
    }
  }

  if (moved === 0 && skipped > 0) console.log('  (nothing to do)');
  return { moved, skipped, failed, bytes };
}

async function main(): Promise<void> {
  if (!isStorageConfigured()) {
    console.error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME,');
    console.error('CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET first.');
    process.exit(1);
  }

  await mongoose.connect(env.databaseUrl);
  console.log(APPLY ? 'MODE: apply' : 'MODE: dry run (pass --apply to migrate)');

  const posts = await Post.find().select('image').lean();
  const postResult = await migrate(
    'Posts',
    posts.map((post) => ({ id: String(post._id), image: post.image ?? '' })),
    POSTS_FOLDER,
    (id, url) => Post.updateOne({ _id: id }, { image: url }),
  );

  const users = await User.find({ image: { $exists: true, $ne: '' } })
    .select('image')
    .lean();
  const userResult = await migrate(
    'User avatars',
    users.map((user) => ({ id: String(user._id), image: user.image ?? '' })),
    AVATARS_FOLDER,
    (id, url) => User.updateOne({ _id: id }, { image: url }),
  );

  const moved = postResult.moved + userResult.moved;
  const skipped = postResult.skipped + userResult.skipped;
  const failed = postResult.failed + userResult.failed;
  const bytes = postResult.bytes + userResult.bytes;

  console.log('\nSummary');
  console.log(`  ${APPLY ? 'moved' : 'would move'} : ${moved}`);
  console.log(`  skipped        : ${skipped} (already URLs or empty)`);
  console.log(`  failed         : ${failed}`);
  console.log(`  ${APPLY ? 'removed from' : 'would remove from'} MongoDB: ${mb(bytes)}`);

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
