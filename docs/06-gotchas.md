# 6. Gotchas & sharp edges

## 6.1 Fixed by the TypeScript / Vite migration

Kept here because the shapes still explain why the code looks the way it does.

| Was | Now |
| --- | --- |
| `createdAt: { default: Date.now() }` — evaluated once at module load | `default: Date.now` (function reference) |
| `POST /comments` unauthenticated; author read from `req.body.comment.user` | Requires a token; author comes from `req.userId` |
| `PATCH /posts` and `DELETE /posts/:id` had no ownership check | Both return `403` unless `post.creator === req.userId` |
| `editUser` took the update filter from `req.body._id` | Always targets `req.userId`; body `_id` ignored |
| `GET /user/:userId` returned the bcrypt hash | Projected with `-password` |
| `deletePost` pruned the **caller's** `posts` array | Prunes the creator's |
| `editPost` passed the whole body to `findByIdAndUpdate` | Whitelists `message`, `image`, `tags` only |
| `getPosts` ran one `User.findOne` per post (N+1) | One batched `$in` query |
| **Google sign-in trusted the browser**: `{ google: true, email }` was taken at face value, so knowing an address granted a session for that account | The access token is verified with Google server-side (`getTokenInfo`), the `aud` is checked against our client ID, and the identity comes from Google — never from the request body |
| `tags` sent as a string, stored as `["react node"]`, rendered as one broken tag | Normalized server-side into a real array |
| Auth failures returned `400` | `401`, with `403` for ownership violations |
| Every thunk swallowed errors into `console.log` | `toErrorMessage()` + toasts; hooks expose `isError` |
| `ErrorPage` rendered the raw `Error` object, so the boundary itself threw | Renders `message` / `statusText` |
| `PostPage` could not fetch; deep links needed the whole feed | `usePost(id)` fetches independently |
| Editing your avatar left stale avatars cached on every post | `useEditProfile` invalidates the feed |
| Token expiry only noticed on the next request | `AuthProvider` signs out on a timer, and syncs across tabs |
| Reducers mutated state objects in place | No reducers; React Query owns immutably-replaced cache entries |
| `key={Math.random()}` remounted caption/bio lines every render | Stable derived keys |
| `Image` hardcoded `id="file"` | `useId()`, so two uploaders can coexist |
| API origin hardcoded in 5 files, Google client ID in a 6th | `VITE_*` env vars via `src/config.ts` |
| Side effects (`Notification.fire`) during render | Fired from handlers and mutation callbacks |
| `react-router-hash-link` (unmaintained, untyped) | Local `useScrollToHash` hook |
| Unused deps: `react-file-base64`, `google-auth-library`, `moment`, `web-vitals` | Removed (`date-fns` replaces `moment`) |
| No tests at all | 57-assertion end-to-end smoke suite |
| Images were base64 blobs in Mongo | Uploaded to Cloudflare R2; posts store URLs (see 5.13) |

## 6.2 Still true — know these

### Object storage is optional, and off until it is configured
`R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` / `R2_PUBLIC_URL` are all
optional. With any of them missing, `isR2Configured()` is false, `/uploads/sign` returns **503**, and
the client silently falls back to inlining base64 — the old behaviour. That fallback is deliberate
(the code deploys before the bucket exists) but it means **a half-configured environment looks fine
and quietly regresses to 9 MB feeds**. Check `GET /uploads/config` if the feed is slow.

Two things live outside the repo and will not come from a fresh clone:
- the bucket must allow **public reads** (r2.dev subdomain or a custom domain);
- its **CORS policy must allow `PUT` from the Netlify origin**, or browser uploads fail.

Presigned URLs are only valid against `https://<account>.r2.cloudflarestorage.com` — never the public
custom domain. `R2_PUBLIC_URL` is for reads only.

### R2 has no image transforms
Unlike Cloudinary, R2 stores exactly the bytes it is given. There is no `w_400` in the URL. So
**client-side resizing in `lib/image.ts` is load-bearing**, not an optimization — remove it and full
camera-resolution originals go straight into the bucket and back out to every feed reader.

### `GET /posts` is unpaginated
Sorted and no longer N+1, but it still returns *every* post. Now that images are URLs the response is
small, so this is no longer urgent — but add cursor pagination before the feed grows.

### The JWT lives in `localStorage`
Readable by any script on the origin. An httpOnly refresh-token cookie would be the stronger design.

### No unique index on `email`
Uniqueness is enforced only by a `findOne` check in `signUp`, so two concurrent registrations for the
same address can both succeed. Deliberately not added, because creating the index would fail on an
existing database that already contains duplicates — do it as a migration.

### Writes are not transactional
Creating a post touches three collections (`posts`, `comments`, `users.posts`); deleting touches the
same three. A crash midway leaves them inconsistent. Mongo multi-document transactions would need a
replica set.

### `commentCount` is denormalized
The server `$inc`s it and the client re-syncs it from `thread.comments.length`. They agree today, but
paginating comments would break that.

### CORS is open by default
`CORS_ORIGINS` is honoured when set, but unset means "any origin" — preserved so existing deployments
keep working. Set it in production.

### Cold starts
If the API host sleeps when idle, the first `GET /posts` can take tens of seconds. React Query
retries twice, and `HomePage` now shows a real error with a "Try again" button instead of an
infinite spinner — but the latency remains.

## 6.3 If you keep going, in priority order

1. **Configure R2 and run the backfill.** The code is live but inert until the bucket exists.
2. **Paginate `GET /posts`** (cursor on `createdAt`).
3. Add `cache-control` to API responses — there is none today.
4. Replace the `posts`/`comments` string ids with real `ObjectId` refs and `.populate()`.
5. Add a `unique` index on `email` as an explicit migration.
6. Move the JWT to an httpOnly cookie with a refresh flow.
7. Add a linter (none ships now that `react-scripts` is gone) and client-side tests.
