# 3. API reference

**Base URL:** `VITE_API_URL` on the client; `http://localhost:5000` by default.

JSON in, JSON out. Authentication is a bearer JWT:

```
Authorization: Bearer <token>
```

## 3.1 Endpoint map

| Method | Path | Auth | Handler | Purpose |
| --- | --- | :---: | --- | --- |
| `GET` | `/health` | — | inline | Liveness + Mongo connection state |
| `POST` | `/auth/signup` | — | `signUp` | Register (email/password **or** Google) |
| `POST` | `/auth/signin` | — | `signIn` | Log in (email/password **or** Google) |
| `GET` | `/posts` | — | `getPosts` | Feed, newest first, author-hydrated |
| `GET` | `/posts/post/:id` | — | `getPost` | One post, author-hydrated |
| `POST` | `/posts` | ✅ | `createPost` | Create a post |
| `PATCH` | `/posts` | ✅ 🔑 | `editPost` | Edit own post (id in the **body**) |
| `POST` | `/posts/likePost/:id` | ✅ | `likePost` | Toggle like |
| `DELETE` | `/posts/:id` | ✅ 🔑 | `deletePost` | Delete own post + its comment thread |
| `GET` | `/user/:userId` | — | `showProfile` | Public profile (no password hash) |
| `PATCH` | `/user/editUser` | ✅ | `editUser` | Update own `bio` and `image` |
| `GET` | `/comments/:postId` | — | `getComments` | Comment thread, commenter-hydrated |
| `POST` | `/comments` | ✅ | `addComments` | Append a comment |
| `GET` | `/uploads/config` | — | `uploadConfig` | Is object storage on, and the size cap |
| `POST` | `/uploads/sign` | ✅ | `signUpload` | Presigned R2 `PutObject` URL |

✅ = requires a valid token &nbsp;•&nbsp; 🔑 = additionally requires **ownership**

```mermaid
flowchart LR
    subgraph Public["No token"]
        P1["GET /health"]
        P2["POST /auth/signup"]
        P3["POST /auth/signin"]
        P4["GET /posts"]
        P5["GET /posts/post/:id"]
        P6["GET /user/:userId"]
        P7["GET /comments/:postId"]
    end
    subgraph Authed["Token required"]
        S1["POST /posts"]
        S2["POST /posts/likePost/:id"]
        S3["PATCH /user/editUser"]
        S4["POST /comments"]
    end
    subgraph Owned["Token + ownership"]
        O1["PATCH /posts"]
        O2["DELETE /posts/:id"]
    end
```

## 3.2 The auth middleware

```mermaid
flowchart TD
    A["Incoming request"] --> B{"Authorization starts with 'Bearer '?"}
    B -->|no| F["401 { message: 'Not Logged In!' }"]
    B -->|yes| C{"jwt.verify(token, JWT_SECRET)"}
    C -->|"valid"| D["req.userId = payload._id"]
    D --> E["next() → controller"]
    C -->|"bad signature / expired"| F
```

- Payload is `{ email, _id }`, HS256, **expires in 1 hour**.
- Every failure returns **401** (previously `400`, which conflated auth failure with bad input).
- Controllers read `req.userId` and never trust a creator id from the request body.

## 3.3 Auth endpoints

### `POST /auth/signup`

Two shapes, discriminated by the `google` flag.

<details>
<summary>Email/password body</summary>

```jsonc
{
  "firstName": "Ada",
  "lastName": "Lovelace",
  "email": "ada@example.com",
  "password": "secret",
  "confirmPassword": "secret"
}
```
</details>

<details>
<summary>Google body</summary>

```jsonc
{ "google": true, "name": "Ada Lovelace", "email": "ada@example.com", "image": "https://…" }
```
</details>

1. Existing email → `400 User already exists!!`
2. Google branch → created with no password.
3. Email branch → mismatched passwords `400`; otherwise bcrypt (salt rounds 12), name is
   `"<firstName> <lastName>"`.

**200** (identical for signup and signin):

```jsonc
{ "user": { "_id": "…", "image": "…", "bio": "----" }, "token": "eyJhbGciOi…" }
```

### `POST /auth/signin`

| Body | Behaviour |
| --- | --- |
| `{ email, password }` | `404 User not found!!`; `400 Please log in via google!!` if the account has no password; `400 Incorrect Password!!` on mismatch |
| `{ email, google: true, image }` | Skips password checks; backfills a missing avatar from Google |

## 3.4 Post endpoints

### `GET /posts`
Array of every post **sorted newest first**, each merged with `userName` / `userImage`.
Authors are resolved with a **single batched query**, not one lookup per post.
Still unpaginated — see [Gotchas](./06-gotchas.md).

### `GET /posts/post/:id`
One hydrated post, or `404 Post not found!!`.

### `POST /posts` 🔒
Body `{ message, image, tags }`. `tags` may be an array **or** a comma/space separated string; the
server normalizes it (`"react, vite  ts"` → `["react","vite","ts"]`). The server sets
`creator: req.userId` and `createdAt`, saves the post, creates its `Comments` document, and unshifts
the id onto `user.posts`.

**201** → the post merged with `userName` / `userImage`.

### `PATCH /posts` 🔒🔑
Body `{ _id, message, image, tags }`. Rejects with `403` unless `post.creator === req.userId`.

Only `message`, `image` and `tags` are written — `creator`, `likes`, `commentCount` and `createdAt`
can no longer be overwritten from the request body.

### `POST /posts/likePost/:id` 🔒
Toggle, implemented atomically with `$addToSet` / `$pull`. Returns the updated, hydrated post.

### `DELETE /posts/:id` 🔒🔑
`403` unless the caller is the creator. Deletes the post, its `Comments` document, and prunes the id
from the **creator's** `posts` array.

## 3.5 User endpoints

### `GET /user/:userId`
Public profile, projected with `-password`:

```jsonc
{ "_id": "…", "name": "Ada Lovelace", "email": "…", "posts": ["…"], "image": "…", "bio": "…" }
```

### `PATCH /user/editUser` 🔒
Body `{ bio, image }`. The target is **always `req.userId`** — any `_id` in the body is ignored, so
one user can no longer write over another's document.

**200** → `{ _id, bio, image }`.

## 3.6 Comment endpoints

### `GET /comments/:postId`
Thread with every entry enriched with the commenter's `name` / `image`, resolved in one batched
query. A post with no thread document returns an empty thread rather than an error.

```jsonc
{
  "_id": "…",
  "postId": "…",
  "comments": [
    { "_id": "…", "user": "…", "comment": "nice!", "createdAt": "…", "name": "Ada Lovelace", "image": "…" }
  ]
}
```

### `POST /comments` 🔒
Body `{ postId, comment: { comment } }`. **The author is taken from the token**, not the body — the
endpoint used to be unauthenticated and trusted `comment.user`, so anyone could post as anyone.
Empty comments are rejected with `400`. Increments `Post.commentCount`.

## 3.7 Upload endpoints

### `GET /uploads/config`
No auth. Returns `{ enabled: boolean, maxBytes: number }`. `enabled` is false when the R2 environment
variables are unset — the client uses it to decide between a presigned upload and the base64
fallback. `maxBytes` is 8 MB.

### `POST /uploads/sign` 🔒
Body `{ contentType, size }`. Returns:

```json
{
  "uploadUrl": "https://<account>.r2.cloudflarestorage.com/<bucket>/posts/<uuid>.jpg?X-Amz-...",
  "publicUrl": "https://<public-host>/posts/<uuid>.jpg",
  "key": "posts/<uuid>.jpg"
}
```

`uploadUrl` is a presigned `PutObject` valid for 5 minutes; the browser PUTs the bytes there directly
so they never pass through the API. Rejects unsupported MIME types with `400`, anything over
`maxBytes` with `413`, and returns **`503`** when R2 is not configured.

## 3.8 Error conventions

Bodies are always `{ "message": "<text>" }`.

| Status | Meaning |
| --- | --- |
| `400` | Validation failure (bad credentials, empty comment, mismatched passwords, bad upload type) |
| `401` | Missing, malformed or expired token |
| `403` | Authenticated, but not the owner of the resource |
| `404` | User, post or route not found |
| `409` | Post creation failed |
| `413` | Upload larger than the 8 MB cap |
| `500` | Unexpected failure |
| `503` | Object storage requested but not configured |

There is now a catch-all `404` handler for unknown routes and a top-level error handler, so the API
never returns Express's HTML error page.

## 3.9 Verification

`server/test/smoke.ts` mounts the real app against an in-memory MongoDB and asserts **47** behaviours
across every endpoint — auth, ownership (403s), the token-over-body comment author, password-hash
projection, cascade delete, tag normalization and feed ordering.

```bash
cd server && npm test
```
