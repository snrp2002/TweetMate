/**
 * Moves inline base64 images out of MongoDB and into R2.
 *
 * Idempotent: documents whose image is already a URL are skipped, so it is safe
 * to re-run after a partial failure. Dry run by default.
 *
 *   npx tsx scripts/migrate-images-to-r2.ts            # report only
 *   npx tsx scripts/migrate-images-to-r2.ts --apply    # perform the migration
 */
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { Post } from '../src/models/posts.js';
import { User } from '../src/models/user.js';
import { buildObjectKey, isR2Configured, isRemoteImage, putObject } from '../src/lib/r2.js';

const APPLY = process.argv.includes('--apply');

interface DataUrl {
  contentType: string;
  buffer: Buffer;
}

/** Parses `data:image/jpeg;base64,...` into bytes. */
function parseDataUrl(value: string): DataUrl | null {
  const match = /^data:([^;,]+);base64,(.+)$/s.exec(value);
  if (!match) return null;
  const [, contentType, payload] = match;
  if (!contentType || !payload) return null;
  return { contentType, buffer: Buffer.from(payload, 'base64') };
}

function mb(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

async function main(): Promise<void> {
  if (!isR2Configured()) {
    console.error('R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,');
    console.error('R2_SECRET_ACCESS_KEY, R2_BUCKET and R2_PUBLIC_URL first.');
    process.exit(1);
  }

  await mongoose.connect(env.databaseUrl);
  console.log(APPLY ? 'MODE: apply\n' : 'MODE: dry run (pass --apply to migrate)\n');

  let moved = 0;
  let skipped = 0;
  let failed = 0;
  let bytesBefore = 0;

  console.log('Posts');
  const posts = await Post.find().select('image').lean();
  for (const post of posts) {
    const id = String(post._id);
    if (isRemoteImage(post.image)) {
      skipped++;
      continue;
    }
    const parsed = parseDataUrl(post.image ?? '');
    if (!parsed) {
      console.log(`  ${id}  SKIP (not a data URL)`);
      skipped++;
      continue;
    }

    bytesBefore += parsed.buffer.byteLength;
    const key = buildObjectKey(parsed.contentType, 'posts');

    if (!APPLY) {
      console.log(`  ${id}  would upload ${mb(parsed.buffer.byteLength)} -> ${key}`);
      moved++;
      continue;
    }

    try {
      const url = await putObject(key, parsed.buffer, parsed.contentType);
      await Post.updateOne({ _id: post._id }, { image: url });
      console.log(`  ${id}  moved ${mb(parsed.buffer.byteLength)} -> ${url}`);
      moved++;
    } catch (error) {
      console.error(`  ${id}  FAILED: ${(error as Error).message}`);
      failed++;
    }
  }

  console.log('\nUser avatars');
  const users = await User.find({ image: { $exists: true, $ne: '' } })
    .select('image')
    .lean();
  for (const user of users) {
    const id = String(user._id);
    if (isRemoteImage(user.image)) {
      skipped++;
      continue;
    }
    const parsed = parseDataUrl(user.image ?? '');
    if (!parsed) {
      skipped++;
      continue;
    }

    bytesBefore += parsed.buffer.byteLength;
    const key = buildObjectKey(parsed.contentType, 'avatars');

    if (!APPLY) {
      console.log(`  ${id}  would upload ${mb(parsed.buffer.byteLength)} -> ${key}`);
      moved++;
      continue;
    }

    try {
      const url = await putObject(key, parsed.buffer, parsed.contentType);
      await User.updateOne({ _id: user._id }, { image: url });
      console.log(`  ${id}  moved ${mb(parsed.buffer.byteLength)}`);
      moved++;
    } catch (error) {
      console.error(`  ${id}  FAILED: ${(error as Error).message}`);
      failed++;
    }
  }

  console.log('\nSummary');
  console.log(`  ${APPLY ? 'moved' : 'would move'} : ${moved}`);
  console.log(`  skipped        : ${skipped} (already URLs or empty)`);
  console.log(`  failed         : ${failed}`);
  console.log(`  bytes removed from MongoDB: ${mb(bytesBefore)}`);

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
