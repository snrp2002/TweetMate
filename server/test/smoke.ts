/**
 * Temporary end-to-end smoke test for the migrated API.
 * Run with: npx tsx smoke.ts
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = await MongoMemoryServer.create();
process.env['DATABASE_URL'] = mongod.getUri('tweetmate_smoke');
process.env['JWT_SECRET'] = 'smoke-test-secret';
process.env['PORT'] = '0';

const mongoose = (await import('mongoose')).default;
const { createApp } = await import('../src/app.js');

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

