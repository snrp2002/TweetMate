/**
 * Temporary end-to-end smoke test for the migrated API.
 * Run with: npx tsx smoke.ts
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createHash, randomBytes } from 'node:crypto';

const mongod = await MongoMemoryServer.create();
process.env['DATABASE_URL'] = mongod.getUri('tweetmate_smoke');
process.env['JWT_SECRET'] = 'smoke-test-secret';
process.env['PORT'] = '0';

const mongoose = (await import('mongoose')).default;
const { createApp } = await import('../src/app.js');
const { publicIdFromUrl } = await import('../src/lib/storage.js');
const { resetRateLimits } = await import('../src/middleware/rateLimit.js');

mongoose.set('strictQuery', false);
await mongoose.connect(process.env['DATABASE_URL']);

const server = createApp().listen(0);
await new Promise((resolve) => server.once('listening', resolve));
const address = server.address();
if (address === null || typeof address === 'string') throw new Error('no port');
const base = `http://127.0.0.1:${address.port}`;

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: unknown): void {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}`);
    if (detail !== undefined) console.log('        ' + JSON.stringify(detail));
  }
}

interface Res<T> {
  status: number;
  body: T;
}

async function call<T = any>(
  method: string,
  path: string,
  options: { token?: string; body?: unknown } = {},
): Promise<Res<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;
  const response = await fetch(base + path, {
    method,
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });
  const text = await response.text();
  let body: any = text;
  try {
    body = JSON.parse(text);
  } catch {
    /* keep raw text */
  }
  return { status: response.status, body };
}

const IMAGE = 'data:image/png;base64,iVBORw0KGgo=';

console.log('\n--- health');
const health = await call('GET', '/health');
check('GET /health returns ok', health.status === 200 && health.body.status === 'ok', health.body);

console.log('\n--- auth');
const signup = await call('POST', '/auth/signup', {
  body: {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    password: 'pw123456',
    confirmPassword: 'pw123456',
  },
});
check('signup returns 200 + token', signup.status === 200 && !!signup.body.token, signup.body);
check('signup returns bio default', signup.body?.user?.bio === '----', signup.body);
const adaToken: string = signup.body.token;
const adaId: string = signup.body.user._id;

const dup = await call('POST', '/auth/signup', {
  body: {
    firstName: 'A',
    lastName: 'B',
    email: 'ada@example.com',
    password: 'x1234567',
    confirmPassword: 'x1234567',
  },
});
check('duplicate signup rejected', dup.status === 400, dup.body);

const mismatch = await call('POST', '/auth/signup', {
  body: {
    firstName: 'A',
    lastName: 'B',
    email: 'other@example.com',
    password: 'x1234567',
    confirmPassword: 'nope',
  },
});
check('password mismatch rejected', mismatch.status === 400, mismatch.body);

const badPw = await call('POST', '/auth/signin', {
  body: { email: 'ada@example.com', password: 'wrong' },
});
check('wrong password rejected', badPw.status === 400, badPw.body);

const missing = await call('POST', '/auth/signin', {
  body: { email: 'nobody@example.com', password: 'x' },
});
check('unknown user 404', missing.status === 404, missing.body);

const signin = await call('POST', '/auth/signin', {
  body: { email: 'ada@example.com', password: 'pw123456' },
});
check('signin succeeds', signin.status === 200 && !!signin.body.token, signin.body);

// A second account, used later for the ownership checks. Google sign-up now
// requires a Google-verified token, so this one is created with a password.
const grace = await call('POST', '/auth/signup', {
  body: {
    firstName: 'Grace',
    lastName: 'Hopper',
    email: 'grace@example.com',
    password: 'pw123456',
    confirmPassword: 'pw123456',
  },
});
check('second account created', grace.status === 200 && !!grace.body.token, grace.body);
const graceToken: string = grace.body.token;
const graceId: string = grace.body.user._id;

console.log('\n--- google identity cannot be self-asserted');

// The original code trusted `{ google: true, email }` outright, so knowing an
// address was enough to obtain a session for it. Each of these must fail.
const claimEmail = await call('POST', '/auth/signin', {
  body: { google: true, email: 'ada@example.com' },
});
check(
  'signin with google:true + email only is rejected',
  claimEmail.status >= 400 && !claimEmail.body.token,
  claimEmail.body,
);

const claimEmailWithImage = await call('POST', '/auth/signin', {
  body: { google: true, email: 'ada@example.com', image: 'https://img/x.png' },
});
check(
  'signin with google:true + email + image is rejected',
  claimEmailWithImage.status >= 400 && !claimEmailWithImage.body.token,
  claimEmailWithImage.body,
);

const forgedToken = await call('POST', '/auth/signin', {
  body: { google: true, accessToken: 'not-a-real-google-token' },
});
check(
  'signin with a forged google token is rejected',
  forgedToken.status >= 400 && !forgedToken.body.token,
  forgedToken.body,
);

const claimSignUp = await call('POST', '/auth/signup', {
  body: { google: true, email: 'brand-new@example.com', name: 'Nobody' },
});
check(
  'signup with google:true + email only is rejected',
  claimSignUp.status >= 400 && !claimSignUp.body.token,
  claimSignUp.body,
);

const forgedSignUp = await call('POST', '/auth/signup', {
  body: { google: true, accessToken: 'not-a-real-google-token' },
});
check(
  'signup with a forged google token is rejected',
  forgedSignUp.status >= 400 && !forgedSignUp.body.token,
  forgedSignUp.body,
);

// The rejected sign-up must not have created anything.
const ghost = await call('POST', '/auth/signin', {
  body: { email: 'brand-new@example.com', password: 'x' },
});
check('rejected google signup created no account', ghost.status === 404, ghost.body);

// A Google-created account has no password. Seed one directly, since it can no
// longer be produced through the API without a real Google token.
const { User } = await import('../src/models/user.js');
await User.create({ name: 'Alan Turing', email: 'alan@example.com', bio: '----' });
const passwordless = await call('POST', '/auth/signin', {
  body: { email: 'alan@example.com', password: 'anything' },
});
check(
  'password login on a google-only account is rejected',
  passwordless.status === 400 && /google/i.test(passwordless.body.message),
  passwordless.body,
);

console.log('\n--- posts auth');
const noAuth = await call('POST', '/posts', { body: { message: 'hi', image: IMAGE } });
check('create without token → 401', noAuth.status === 401, noAuth.body);

const badToken = await call('POST', '/posts', {
  token: 'not-a-jwt',
  body: { message: 'hi', image: IMAGE },
});
check('create with bad token → 401', badToken.status === 401, badToken.body);

console.log('\n--- post lifecycle');
const created = await call('POST', '/posts', {
  token: adaToken,
  body: { message: 'first tweet', image: IMAGE, tags: 'react, node  vite' },
});
check('create post → 201', created.status === 201, created.body);
check('create hydrates userName', created.body.userName === 'Ada Lovelace', created.body.userName);
check(
  'tags string split into array',
  JSON.stringify(created.body.tags) === JSON.stringify(['react', 'node', 'vite']),
  created.body.tags,
);
check('commentCount starts at 0', created.body.commentCount === 0, created.body);
const postId: string = created.body._id;

const feed = await call('GET', '/posts');
check('feed returns 1 post', feed.status === 200 && feed.body.length === 1, feed.body?.length);
check('feed hydrates author', feed.body[0]?.userName === 'Ada Lovelace', feed.body[0]);

const single = await call('GET', `/posts/post/${postId}`);
check('get single post', single.status === 200 && single.body._id === postId, single.body);

const missingPost = await call('GET', '/posts/post/64b7f9f9f9f9f9f9f9f9f9f9');
check('missing post → 404', missingPost.status === 404, missingPost.body);

console.log('\n--- likes');
const like1 = await call('POST', `/posts/likePost/${postId}`, { token: adaToken });
check('like adds user', like1.body?.likes?.length === 1, like1.body?.likes);
const like2 = await call('POST', `/posts/likePost/${postId}`, { token: adaToken });
check('like toggles off', like2.body?.likes?.length === 0, like2.body?.likes);
const like3 = await call('POST', `/posts/likePost/${postId}`, { token: graceToken });
check('other user can like', like3.body?.likes?.length === 1, like3.body?.likes);

console.log('\n--- comments');
const commentNoAuth = await call('POST', '/comments', {
  body: { postId, comment: { user: adaId, comment: 'spoofed' } },
});
check('comment without token → 401', commentNoAuth.status === 401, commentNoAuth.body);

const comment1 = await call('POST', '/comments', {
  token: graceToken,
  body: { postId, comment: { user: adaId, comment: 'nice work!' } },
});
check('comment created', comment1.status === 200 && comment1.body.comments.length === 1, comment1.body);
check(
  'comment author taken from token, not body',
  comment1.body.comments[0]?.name === 'Grace Hopper',
  comment1.body.comments[0],
);

const emptyComment = await call('POST', '/comments', {
  token: graceToken,
  body: { postId, comment: { user: adaId, comment: '   ' } },
});
check('empty comment rejected', emptyComment.status === 400, emptyComment.body);

const thread = await call('GET', `/comments/${postId}`);
check('thread readable', thread.status === 200 && thread.body.comments.length === 1, thread.body);

const feed2 = await call('GET', '/posts');
check('commentCount incremented', feed2.body[0]?.commentCount === 1, feed2.body[0]?.commentCount);

console.log('\n--- deleting comments');

// Every request in this suite comes from 127.0.0.1, so unrelated sections
// would otherwise share rate-limit buckets and fail for the wrong reason.
resetRateLimits();

// Grace wrote the comment; Ada owns the post. A third party may not remove it.
const outsider = await call('POST', '/auth/signup', {
  body: {
    firstName: 'Mary',
    lastName: 'Somerville',
    email: 'mary@example.com',
    password: 'pw123456',
    confirmPassword: 'pw123456',
  },
});
const alanToken: string = outsider.body.token;
check('outsider account created', outsider.status === 200 && !!alanToken, outsider.body);
const commentId: string = comment1.body.comments[0]._id;

const delNoAuth = await call('DELETE', `/comments/${postId}/${commentId}`);
check('delete comment without token → 401', delNoAuth.status === 401, delNoAuth.body);

const delStranger = await call('DELETE', `/comments/${postId}/${commentId}`, { token: alanToken });
check('a stranger cannot delete a comment', delStranger.status === 403, delStranger.body);

const delMissing = await call('DELETE', `/comments/${postId}/64dc7e52b431d1ac8d0d8149`, {
  token: graceToken,
});
check('deleting an unknown comment → 404', delMissing.status === 404, delMissing.body);

// The post owner can clear a comment off their own photo, even though someone
// else wrote it — that is the whole point of the second permission.
const delByOwner = await call('DELETE', `/comments/${postId}/${commentId}`, { token: adaToken });
check(
  'the post owner can delete someone else\u2019s comment',
  delByOwner.status === 200 && delByOwner.body.comments.length === 0,
  delByOwner.body,
);

const feedAfterDelete = await call('GET', '/posts');
check(
  'commentCount decremented',
  feedAfterDelete.body[0]?.commentCount === 0,
  feedAfterDelete.body[0]?.commentCount,
);

// Re-comment so later assertions still have a thread to work with.
const comment2 = await call('POST', '/comments', {
  token: graceToken,
  body: { postId, comment: { comment: 'second pass' } },
});
const comment2Id: string = comment2.body.comments[0]._id;
const delByAuthor = await call('DELETE', `/comments/${postId}/${comment2Id}`, {
  token: graceToken,
});
check('the comment author can delete their own', delByAuthor.status === 200, delByAuthor.body);

await call('POST', '/comments', {
  token: graceToken,
  body: { postId, comment: { comment: 'nice work!' } },
});

console.log('\n--- password reset (mail unconfigured in tests)');

const forgotEmpty = await call('POST', '/auth/forgot', { body: {} });
check('forgot without an address → 400', forgotEmpty.status === 400, forgotEmpty.body);

const forgotUnconfigured = await call('POST', '/auth/forgot', {
  body: { email: 'ada@example.com' },
});
check(
  'forgot → 503 when mail is not configured',
  forgotUnconfigured.status === 503,
  forgotUnconfigured.body,
);

const resetBadToken = await call('POST', '/auth/reset', {
  body: {
    token: 'not-a-real-token',
    email: 'ada@example.com',
    password: 'newpassword',
    confirmPassword: 'newpassword',
  },
});
check('reset with a bogus token → 400', resetBadToken.status === 400, resetBadToken.body);

const resetMismatch = await call('POST', '/auth/reset', {
  body: {
    token: 'x',
    email: 'ada@example.com',
    password: 'newpassword',
    confirmPassword: 'different',
  },
});
check('reset rejects mismatched passwords', resetMismatch.status === 400, resetMismatch.body);

// The reset fields must never ride along on an ordinary profile read.
const profileLeak = await call('GET', `/user/${adaId}`);
check(
  'profile never exposes reset-token fields',
  profileLeak.body.resetTokenHash === undefined &&
    profileLeak.body.resetTokenExpires === undefined,
  Object.keys(profileLeak.body),
);

// Drive the happy path without a mail provider by writing the token hash onto
// the user exactly as forgotPassword would. This is the part that actually
// matters: without it only the rejection paths would be covered.
const rawToken = randomBytes(32).toString('hex');
const tokenHash = createHash('sha256').update(rawToken).digest('hex');

await User.updateOne(
  { email: 'grace@example.com' },
  { resetTokenHash: tokenHash, resetTokenExpires: new Date(Date.now() + 10 * 60 * 1000) },
);

const resetOk = await call('POST', '/auth/reset', {
  body: {
    token: rawToken,
    email: 'grace@example.com',
    password: 'brandnewpw',
    confirmPassword: 'brandnewpw',
  },
});
check(
  'a valid token resets the password and returns a session',
  resetOk.status === 200 && !!resetOk.body.token && !!resetOk.body.user,
  resetOk.body,
);

const signInNew = await call('POST', '/auth/signin', {
  body: { email: 'grace@example.com', password: 'brandnewpw' },
});
check('the new password works', signInNew.status === 200, signInNew.body);

const signInOld = await call('POST', '/auth/signin', {
  body: { email: 'grace@example.com', password: 'pw123456' },
});
check('the old password stops working', signInOld.status === 400, signInOld.body);

// Burned on use, so an intercepted link cannot be replayed.
const replay = await call('POST', '/auth/reset', {
  body: {
    token: rawToken,
    email: 'grace@example.com',
    password: 'anotherpw',
    confirmPassword: 'anotherpw',
  },
});
check('the token cannot be replayed', replay.status === 400, replay.body);

// An expired token must fail even though the hash still matches.
const staleToken = randomBytes(32).toString('hex');
await User.updateOne(
  { email: 'grace@example.com' },
  {
    resetTokenHash: createHash('sha256').update(staleToken).digest('hex'),
    resetTokenExpires: new Date(Date.now() - 1000),
  },
);
const expired = await call('POST', '/auth/reset', {
  body: {
    token: staleToken,
    email: 'grace@example.com',
    password: 'anotherpw',
    confirmPassword: 'anotherpw',
  },
});
check('an expired token is refused', expired.status === 400, expired.body);

console.log('\n--- rate limiting');

resetRateLimits();

// signin allows 20 per window; the 21st must be refused even with good
// credentials, otherwise the limiter is not actually protecting anything.
let limited = 0;
let lastStatus = 0;
for (let i = 0; i < 24; i += 1) {
  const attempt = await call('POST', '/auth/signin', {
    body: { email: 'ada@example.com', password: 'wrong-password' },
  });
  lastStatus = attempt.status;
  if (attempt.status === 429) limited += 1;
}
check('repeated sign-in attempts hit a 429', limited > 0 && lastStatus === 429, {
  limitedResponses: limited,
});

const stillLimited = await call('POST', '/auth/signin', {
  body: { email: 'ada@example.com', password: 'pw123456' },
});
check(
  'the limit applies even to correct credentials',
  stillLimited.status === 429 && typeof stillLimited.body.message === 'string',
  stillLimited.body,
);

console.log('\n--- image uploads (storage unconfigured in tests)');

const upCfg = await call('GET', '/uploads/config');
check(
  'upload config reports disabled without storage creds',
  upCfg.status === 200 && upCfg.body.enabled === false && typeof upCfg.body.maxBytes === 'number',
  upCfg.body,
);

const signNoAuth = await call('POST', '/uploads/sign', {
  body: { contentType: 'image/jpeg', size: 1000 },
});
check('sign upload without token → 401', signNoAuth.status === 401, signNoAuth.body);

const signUnconfigured = await call('POST', '/uploads/sign', {
  token: adaToken,
  body: { contentType: 'image/jpeg', size: 1000 },
});
check(
  'sign upload → 503 when storage is not configured',
  signUnconfigured.status === 503,
  signUnconfigured.body,
);

// publicIdFromUrl is what makes deleting a post delete its image, so it has to
// survive both plain and transformed delivery URLs.
check(
  'publicIdFromUrl reads a plain delivery URL',
  publicIdFromUrl(
    'https://res.cloudinary.com/demo/image/upload/v1699999999/tweetmate/posts/abc.jpg',
  ) === 'tweetmate/posts/abc',
);
check(
  'publicIdFromUrl ignores transformation segments',
  publicIdFromUrl(
    'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_900/v1699999999/tweetmate/posts/abc.webp',
  ) === 'tweetmate/posts/abc',
);
check('publicIdFromUrl rejects a non-Cloudinary URL', publicIdFromUrl('data:image/png;base64,x') === null);

// The whole point of the fallback: posting still works with inline base64.
const fallbackPost = await call('POST', '/posts', {
  token: adaToken,
  body: { message: 'inline fallback still works', image: IMAGE },
});
check('posting with inline base64 still works', fallbackPost.status === 201, fallbackPost.body);
if (fallbackPost.status === 201) {
  await call('DELETE', `/posts/${fallbackPost.body._id}`, { token: adaToken });
}

console.log('\n--- ownership');
const foreignEdit = await call('PATCH', '/posts', {
  token: graceToken,
  body: { _id: postId, message: 'hacked', image: IMAGE, tags: '' },
});
check('editing another user post → 403', foreignEdit.status === 403, foreignEdit.body);

const foreignDelete = await call('DELETE', `/posts/${postId}`, { token: graceToken });
check('deleting another user post → 403', foreignDelete.status === 403, foreignDelete.body);

const edited = await call('PATCH', '/posts', {
  token: adaToken,
  body: { _id: postId, message: 'edited tweet', image: IMAGE, tags: 'updated' },
});
check('owner can edit', edited.status === 200 && edited.body.message === 'edited tweet', edited.body);
check('edit preserves likes', edited.body.likes?.length === 1, edited.body.likes);
check('edit preserves commentCount', edited.body.commentCount === 1, edited.body.commentCount);

console.log('\n--- profile');
const profile = await call('GET', `/user/${adaId}`);
check('profile readable', profile.status === 200 && profile.body.name === 'Ada Lovelace', profile.body);
check('profile omits password hash', profile.body.password === undefined, Object.keys(profile.body));
check('profile lists the post', profile.body.posts?.[0] === postId, profile.body.posts);

// The profile grid used to fetch one post per tile; this endpoint replaces
// N requests with one, so it has to match what those N would have returned.
const userPosts = await call('GET', `/user/${adaId}/posts`);
check(
  'user posts returns hydrated posts',
  userPosts.status === 200 &&
    Array.isArray(userPosts.body) &&
    userPosts.body.length === 1 &&
    userPosts.body[0]._id === postId,
  userPosts.body,
);
check(
  'user posts hydrates the author exactly like the feed does',
  JSON.stringify(userPosts.body[0]) ===
    JSON.stringify((await call('GET', '/posts')).body.find((p: any) => p._id === postId)),
  { batch: userPosts.body[0] },
);
check(
  'user posts excludes other authors',
  (await call('GET', `/user/${graceId}/posts`)).body.length === 0,
);

const editProfileNoAuth = await call('PATCH', '/user/editUser', {
  body: { _id: adaId, bio: 'x', image: 'y' },
});
check('editUser without token → 401', editProfileNoAuth.status === 401, editProfileNoAuth.body);

const hijack = await call('PATCH', '/user/editUser', {
  token: graceToken,
  body: { _id: adaId, bio: 'HIJACKED', image: 'z' },
});
const adaAfter = await call('GET', `/user/${adaId}`);
check(
  'editUser ignores _id from body (no cross-user write)',
  hijack.status === 200 && adaAfter.body.bio !== 'HIJACKED',
  { hijack: hijack.body, adaBio: adaAfter.body.bio },
);

const editedProfile = await call('PATCH', '/user/editUser', {
  token: adaToken,
  body: { _id: adaId, bio: 'building things', image: IMAGE },
});
check('owner can edit profile', editedProfile.body?.bio === 'building things', editedProfile.body);

console.log('\n--- delete cascade');
const deleted = await call('DELETE', `/posts/${postId}`, { token: adaToken });
check('owner can delete', deleted.status === 200, deleted.body);
const feed3 = await call('GET', '/posts');
check('feed empty after delete', feed3.body.length === 0, feed3.body);
const threadAfter = await call('GET', `/comments/${postId}`);
check('comment thread removed', threadAfter.body.comments.length === 0, threadAfter.body);
const profileAfter = await call('GET', `/user/${adaId}`);
check('post id pruned from profile', profileAfter.body.posts.length === 0, profileAfter.body.posts);

console.log('\n--- ordering');
const p1 = await call('POST', '/posts', { token: adaToken, body: { message: 'older', image: IMAGE } });
await new Promise((r) => setTimeout(r, 20));
const p2 = await call('POST', '/posts', { token: adaToken, body: { message: 'newer', image: IMAGE } });
check('both posts created', p1.status === 201 && p2.status === 201);
const ordered = await call('GET', '/posts');
check('feed is newest-first', ordered.body[0]?.message === 'newer', ordered.body.map((p: any) => p.message));

const unknown = await call('GET', '/definitely-not-a-route');
check('unknown route → 404 json', unknown.status === 404 && !!unknown.body.message, unknown.body);

console.log(`\n${passed} passed, ${failed} failed\n`);

await new Promise((resolve) => server.close(resolve));
await mongoose.disconnect();
await mongod.stop();
process.exit(failed > 0 ? 1 : 0);

