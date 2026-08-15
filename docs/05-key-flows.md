# 5. Key flows

Sequence diagrams for every meaningful user journey. Participants:

| Alias | Meaning |
| --- | --- |
| **U** | User / browser |
| **C** | React component |
| **H** | Hook — a React Query hook or a Context method |
| **QC** | TanStack Query cache |
| **AX** | axios layer (`src/api/`) |
| **LS** | `localStorage` |
| **API** | Express server |
| **DB** | MongoDB |

---

## 5.1 App bootstrap

```mermaid
sequenceDiagram
    autonumber
    participant U as Browser
    participant M as main.tsx
    participant AU as AuthProvider
    participant LS as localStorage
    participant C as HomePage
    participant H as usePosts()
    participant API as Express API
    participant DB as MongoDB

    U->>M: load bundle
    M->>AU: mount provider
    AU->>LS: readStoredSession()
    LS-->>AU: session or null
    AU->>AU: discard it if the token already expired
    AU->>AU: schedule signOut at exp
    M->>C: render route
    C->>H: usePosts()
    H->>API: GET /posts
    API->>DB: Post.find().sort(createdAt desc)
    API->>DB: one batched User.find({_id: {$in: creatorIds}})
    API-->>H: hydrated posts, newest first
    H-->>C: data, or isPending / isError
```

Nothing is fetched at the app root any more — each route requests only what it renders. `HomePage`
distinguishes **loading**, **error with a retry button**, and **genuinely empty**.

---

## 5.2 Email sign-up

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant C as AuthForm
    participant AU as AuthProvider
    participant AX as api/auth.ts
    participant API as Express API
    participant DB as MongoDB
    participant LS as localStorage

    U->>C: fill name, email, password, confirm
    C->>C: trim fields, reject blanks and mismatches
    C->>C: setBusy(true) → render Loader
    C->>AU: signUp(input)
    AU->>AX: POST /auth/signup
    AX->>API: JSON body
    API->>DB: User.findOne(email)
    alt already exists
        API-->>C: 400 User already exists
        C->>U: error toast
    else new user
        API->>API: bcrypt.genSalt(12) then hash
        API->>DB: User.create(...)
        API->>API: jwt.sign({email, _id}) expires 1h
        API-->>AU: 200 { user, token }
        AU->>LS: writeStoredSession
        AU->>AU: schedule auto sign-out at exp
        C->>U: success toast, navigate('/')
    end
```

Errors surface as toasts from the `catch` block. The old flow navigated to `/auth` carrying the
message in router state and fired the toast during render.

---

## 5.3 Google sign-in / sign-up

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant C as GoogleSignInButton
    participant G as Google Identity Services
    participant GA as googleapis userinfo
    participant AU as AuthProvider
    participant API as Express API

    Note over C: only mounted when VITE_GOOGLE_CLIENT_ID is set
    U->>C: click "Sign In with Google"
    C->>G: useGoogleLogin() implicit flow
    G-->>C: access_token
    C->>GA: GET /oauth2/v3/userinfo
    GA-->>C: email, name, picture, email_verified
    alt not verified
        C->>U: error toast, stop
    else verified
        C->>AU: signIn/signUp({google: true, email, name, image})
        AU->>API: POST /auth/signin or /auth/signup
        API->>API: trusts the google flag, skips password checks
        API-->>AU: 200 { user, token }
        AU->>U: success toast, navigate('/')
    end
```

Isolating this in its own component matters: Google's script throws
`Missing required parameter client_id` **on mount** when the ID is empty, which previously took down
the entire auth page.

---

## 5.4 Create a post

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant IMG as UI/Form/Image
    participant PF as PostFormContext
    participant C as PostForm
    participant H as useCreatePost()
    participant API as Express API
    participant DB as MongoDB
    participant QC as Query cache

    U->>C: type caption and tags
    C->>PF: setField('message' | 'tags', value)
    U->>IMG: choose an image
    Note over IMG: see 5.13 — resize, then R2 URL or base64
    IMG->>PF: setField('image', url | base64)
    U->>C: submit
    C->>C: reject empty caption or missing image
    C->>H: mutateAsync(data)
    H->>API: POST /posts (Bearer token)
    API->>API: auth middleware sets req.userId
    API->>API: normalizeTags("react, vite  ts")
    API->>DB: Post.create({..., creator, tags: [react, vite, ts]})
    API->>DB: Comments.create({postId})
    API->>DB: unshift postId onto users.posts
    API-->>H: 201 hydrated post
    H->>QC: prepend to ['posts'], seed ['posts', id]
    H->>QC: invalidate ['users', creator]
    C->>PF: reset()
    C->>U: success toast
```

The form only clears **after** the request resolves; a failure keeps the draft and shows the error.

---

## 5.5 Edit a post

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant PM as PostModal
    participant SW as SweetAlert Confirm
    participant PF as PostFormContext
    participant C as PostForm
    participant H as useEditPost()
    participant API as Express API
    participant QC as Query cache

    U->>PM: open the ... menu, click Edit Post
    Note over PM: item rendered only when user._id === post.creator
    PM->>SW: "Are you sure you want to edit this post?"
    SW-->>PM: confirmed
    PM->>PF: startEditing(post) → mode 'edit', tags joined back to a string
    PM->>PM: useScrollToHash('/', 'newPost')
    U->>C: change fields, click Save
    C->>H: mutateAsync({...data, _id})
    H->>API: PATCH /posts (Bearer token)
    API->>API: 403 unless post.creator === req.userId
    API->>API: writes message, image, tags only
    API-->>H: 200 hydrated post
    H->>QC: replace in ['posts'] and ['posts', id]
    C->>PF: reset()
```

Because the server whitelists fields, `likes`, `commentCount` and `createdAt` survive an edit even
though the form still round-trips the whole post.

---

## 5.6 Delete a post

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant PM as PostModal
    participant H as useDeletePost()
    participant API as Express API
    participant DB as MongoDB
    participant QC as Query cache

    U->>PM: click Delete Post
    PM->>PM: confirmAction(...)
    PM->>H: mutateAsync(post._id)
    H->>API: DELETE /posts/:id (Bearer token)
    API->>API: 403 unless caller is the creator
    API->>DB: Post.deleteOne
    API->>DB: Comments.deleteOne by postId
    API->>DB: $pull postId from the creator's users.posts
    API-->>H: 200
    H->>QC: filter ['posts'], remove ['posts', id] and ['comments', id]
    H->>QC: invalidate ['users']
    PM->>U: success toast, navigate('/')
```

---

## 5.7 Like / unlike

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant C as Post
    participant H as useLikePost()
    participant API as Express API
    participant DB as MongoDB
    participant QC as Query cache

    U->>C: click the heart
    alt not signed in
        C->>U: warning toast "Login to like the post!"
    else signed in
        C->>H: mutate(post._id)
        H->>API: POST /posts/likePost/:id
        API->>DB: $addToSet or $pull likes[userId]
        API-->>H: 200 hydrated post
        H->>QC: write into ['posts'] and ['posts', id]
        QC-->>C: filled or outline heart, new count
    end
```

The icon is derived (`post.likes.includes(user._id)`), and the toggle is now a single atomic update
rather than read-modify-write.

---

## 5.8 Comments

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant C as Post
    participant CS as Comments
    participant HQ as useComments()
    participant HM as useAddComment()
    participant API as Express API
    participant DB as MongoDB
    participant QC as Query cache

    U->>C: click the comment icon
    C->>CS: render (showComments = true)
    CS->>HQ: useComments(postId, enabled)
    HQ->>API: GET /comments/:postId
    API->>DB: Comments.findOne + one batched User.find
    API-->>HQ: thread with name/image per entry
    HQ->>QC: cache under ['comments', postId]

    U->>CS: type a comment, press Enter
    alt not signed in
        CS->>U: warning toast "Login to comment the post!"
    else signed in
        CS->>HM: mutateAsync(text)
        HM->>API: POST /comments (Bearer token)
        API->>API: author = req.userId (body value ignored)
        API->>DB: $push $position 0, then $inc commentCount
        API-->>HM: 200 hydrated thread
        HM->>QC: set ['comments', postId]
        HM->>QC: sync commentCount on ['posts'] and ['posts', id]
    end
```

The thread is fetched lazily — `enabled` keeps the query idle until the section is opened.

---

## 5.9 Viewing a profile

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant PR as Profile
    participant HU as useUser()
    participant UP as UserPost tile
    participant HP as usePost()
    participant QC as Query cache
    participant API as Express API

    U->>PR: navigate to /user/:userId
    PR->>HU: useUser(userId)
    HU->>API: GET /user/:userId
    API-->>HU: profile (password projected out)
    PR->>UP: one tile per post id
    loop each tile
        UP->>HP: usePost(id)
        HP->>QC: cached or already in flight?
        alt cache hit
            QC-->>UP: instant
        else miss
            HP->>API: GET /posts/post/:id
            API-->>HP: hydrated post
        end
    end
    U->>UP: hover → like/comment counts
    U->>UP: click → navigate to /post/:id
```

Tiles now share one cache with the feed and every other view, so repeat visits are free — the old
version refetched all N posts on every mount.

---

## 5.10 Editing your profile

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant E as EditProfile
    participant H as useEditProfile()
    participant API as Express API
    participant AU as AuthProvider
    participant LS as localStorage
    participant QC as Query cache

    U->>E: click the pencil (owner only)
    E->>E: seed bio/image from the session
    U->>E: edit bio, pick an avatar, submit
    E->>H: mutateAsync({bio, image})
    H->>API: PATCH /user/editUser (Bearer token)
    API->>API: target is req.userId, body _id ignored
    API-->>H: 200 { _id, bio, image }
    H->>AU: updateUser(user)
    AU->>LS: persist merged session
    H->>QC: invalidate ['users', id] AND ['posts']
    QC-->>U: navbar, profile and every post avatar refresh
```

Invalidating `['posts']` is the fix for stale avatars: the author image is denormalized into every
post, so the feed has to be refetched after a profile change.

---

## 5.11 Session expiry and sign-out

```mermaid
stateDiagram-v2
    [*] --> Anonymous
    Anonymous --> Authenticated : signIn / signUp
    Authenticated --> Authenticated : updateUser after a profile edit
    Authenticated --> Anonymous : signOut from the navbar menu
    Authenticated --> Anonymous : setTimeout fires at token exp
    Authenticated --> Anonymous : 'storage' event (signed out in another tab)
    note right of Authenticated
        session in AuthProvider
        mirrored to localStorage.user
        JWT valid for 1 hour
    end note
    note right of Anonymous
        localStorage cleared
        read-only browsing still allowed
    end note
```

Expiry is **proactive**: `AuthProvider` schedules `signOut` for the exact expiry instant, so an idle
tab logs itself out instead of appearing signed in until the next failed request.

---

## 5.12 Sharing a post

```mermaid
flowchart LR
    A["Share icon on a Post"] --> B["react-share WhatsappShareButton"]
    B --> C["opens wa.me with<br/>postUrl(id) from VITE_SHARE_BASE_URL"]
    D["Copy Link in PostModal"] --> E["navigator.clipboard.writeText(same URL)"]
    E --> F["success toast"]
    C --> G["recipient opens /post/:id"]
    G --> H["Netlify rewrites to index.html"]
    H --> I["usePost(id) → GET /posts/post/:id"]
    I --> J["post renders — the feed is never fetched"]
```

The share origin comes from `VITE_SHARE_BASE_URL` (defaulting to the current origin) instead of a
hardcoded Netlify URL, so links are correct in every environment.

---

## 5.13 Uploading an image

`UI/Form/Image` has two modes. It asks the server which one is live, then takes that branch. The
resize step runs either way — it is what actually shrank the payload.

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant IMG as UI/Form/Image
    participant IL as lib/image.ts
    participant API as Express API
    participant R2 as Cloudflare R2
    participant PF as PostFormContext

    IMG->>API: GET /uploads/config (cached by React Query)
    API-->>IMG: { enabled, maxBytes }

    U->>IMG: choose a file
    IMG->>IL: compressImage(file)
    IL->>IL: canvas resize, longest edge ≤ 1600px
    IL->>IL: re-encode as JPEG q0.72
    IL-->>IMG: compressed Blob

    alt R2 configured
        IMG->>API: POST /uploads/sign { contentType, size }
        API->>API: auth guard, size + MIME check
        API->>R2: getSignedUrl(PutObject, posts/<uuid>.jpg)
        API-->>IMG: { uploadUrl, publicUrl }
        IMG->>R2: PUT bytes directly (plain fetch, no JWT)
        R2-->>IMG: 200
        IMG->>PF: setField('image', publicUrl)
    else R2 not configured
        IMG->>IL: toBase64(blob)
        IL-->>IMG: data: URL
        IMG->>PF: setField('image', dataUrl)
    end
```

Why it is shaped this way:

| Decision | Reason |
| --- | --- |
| Browser PUTs straight to R2 | Image bytes never touch the free-tier Render instance |
| Presigned URL, not a proxy route | No streaming, no memory spike, no request-size limit to raise |
| Plain `fetch`, not the axios instance | The axios interceptor attaches the JWT — it must not reach R2 |
| `isR2Configured()` gate | Unset credentials fall back to base64, so the code ships before the bucket exists |
| Resize before either branch | 1600px is the cap that turned 2.3 MB images into ~50 KB |
| `cache-control: immutable` on the object | Keys are content-addressed by uuid, so they can be cached forever |

Existing base64 posts are migrated with `npm run migrate:images` in `server/` — a dry run by default,
`-- --apply` to write. It is idempotent: `isRemoteImage()` skips anything already on R2.
