# 4. Frontend & state

The Redux store is gone. State is now split by **who owns it**:

| Kind of state | Owner | Why |
| --- | --- | --- |
| Posts, comments, profiles | **TanStack Query** | It is a cache of server data — caching, dedupe, loading/error and retries come for free |
| Session (JWT + user) | **`AuthProvider`** Context | Genuine client state, tiny, changes rarely |
| Create/edit post draft | **`PostFormProvider`** Context | Shared between `PostModal` and `PostForm`, never persisted |

## 4.1 Bootstrap chain

```mermaid
flowchart TD
    A["main.tsx — createRoot(#root)"] --> S["StrictMode"]
    S --> B["GoogleOAuthProvider<br/>clientId from VITE_GOOGLE_CLIENT_ID"]
    B --> Q["QueryClientProvider<br/>staleTime 30s, retry 2"]
    Q --> AU["AuthProvider<br/>restores localStorage session"]
    AU --> PF["PostFormProvider"]
    PF --> APP["App.tsx → RouterProvider"]
```

Two things happen before the first paint:

1. `AuthProvider` calls `readStoredSession()`, which **discards an already-expired token** instead of
   handing back a dead session.
2. No data is fetched. Each route asks for exactly what it needs — unlike the old `App.js`, which
   eagerly loaded the entire feed on every boot.

`index.html` provides `#root`, `#overlay-root` and `#modal-root`; the last two back all portals.

## 4.2 Routes

| Path | Element | Notes |
| --- | --- | --- |
| `/` | `RootLayout` | Navbar + `<Outlet/>`; `errorElement` is `ErrorPage` |
| `/` (index) | `HomePage` | `NewPost` + `Posts`, with real loading and error states |
| `/auth` | `AuthPage` | Redirects to `/` when already authenticated |
| `/post/:postId` | `PostPage` | **Fetches independently** — deep links no longer need the feed |
| `/user/:userId` | `UserPage` | Profile header + post grid |
| `*` | `NotFound` | Outside `RootLayout`, so no navbar |

```mermaid
flowchart TD
    R["/ RootLayout"] --> N["Navbar"]
    R --> O["Outlet"]
    O --> H["index → HomePage"]
    O --> A["/auth → AuthPage"]
    O --> P["/post/:postId → PostPage"]
    O --> U["/user/:userId → UserPage"]
    Star["* → NotFound"]

    H --> NP["NewPost → PostForm"]
    H --> PS["Posts → Post[]"]
    A --> AU["Auth → AuthForm"]
    AU --> GB["GoogleSignInButton<br/>(only when a client ID is set)"]
    P --> PP["Post"]
    U --> PR["Profile"]
    PR --> USR["User → EditProfile"]
    PR --> UPS["UserPosts → UserPost[]"]

    PS --> PO["Post"]
    PO --> PM["PostModal (portal)"]
    PO --> CM["Comments → Comment[]"]
```

## 4.3 The data layer

```mermaid
flowchart LR
    subgraph Components
        C1["HomePage"]
        C2["PostPage / UserPost"]
        C3["Comments"]
        C4["Profile"]
    end
    subgraph Hooks["queries/ — TanStack Query"]
        H1["usePosts()"]
        H2["usePost(id)"]
        H3["useComments(id)"]
        H4["useUser(id)"]
        H5["useCreatePost / useEditPost<br/>useLikePost / useDeletePost"]
        H6["useAddComment"]
        H7["useEditProfile"]
    end
    subgraph Api["api/ — typed axios"]
        A1["posts.ts"]
        A2["comments.ts"]
        A3["users.ts"]
        A4["auth.ts"]
        A5["client.ts<br/>interceptor + toErrorMessage"]
    end

    C1 --> H1
    C2 --> H2
    C3 --> H3
    C3 --> H6
    C4 --> H4
    C4 --> H7
    Hooks --> Api
    Api --> A5
    A5 --> Server["Express API"]
```

Every hook returns `{ data, isPending, isError, error }`, so loading and failure are handled at the
component that needs them — the old code funnelled every failure into `console.log`.

### Cache keys

```ts
queryKeys = {
  posts:              ['posts'],
  post:    (id)   =>  ['posts', id],
  comments:(postId)=> ['comments', postId],
  user:    (userId)=> ['users', userId],
}
```

### How mutations keep the cache correct

| Mutation | Cache effect |
| --- | --- |
| `useCreatePost` | Prepends to `['posts']`, seeds `['posts', id]`, invalidates the author's profile |
| `useEditPost` | Replaces the post in `['posts']` and `['posts', id]` |
| `useLikePost` | Same — the server returns the whole updated post |
| `useDeletePost` | Filters `['posts']`, removes `['posts', id]` and `['comments', id]`, invalidates profiles |
| `useAddComment` | Writes the thread to `['comments', postId]` and syncs `commentCount` on the post |
| `useEditProfile` | Updates the session, invalidates the profile **and the feed** (avatars are denormalized into every post) |

That last row is a bug fix: previously, changing your avatar left every cached post showing the old one.

### `usePost` and deep links

```ts
useQuery({
  queryKey: queryKeys.post(postId),
  queryFn: () => fetchPost(postId),
  // Show the feed's copy instantly, but still fetch.
  placeholderData: () =>
    queryClient.getQueryData<Post[]>(queryKeys.posts)?.find((p) => p._id === postId),
});
```

Navigating from the feed renders immediately; opening `/post/:id` cold issues exactly one request
(`GET /posts/post/:id`) and never loads the feed.

The same hook backs each profile-grid tile, so React Query **dedupes and caches** those requests —
revisiting a profile costs nothing.

## 4.4 Auth context

```ts
const { session, user, isAuthenticated, signIn, signUp, signOut, updateUser } = useAuth();
```

`AuthProvider` also does two things the old reducer did not:

```mermaid
flowchart TD
    A["session changes"] --> B["millisecondsUntilExpiry(token)"]
    B --> C{"already expired?"}
    C -->|yes| D["signOut() immediately"]
    C -->|no| E["setTimeout(signOut, remaining)"]
    F["'storage' event from another tab"] --> G["re-read localStorage → setSession"]
```

- **Proactive expiry.** The user is signed out the instant the token dies, not on the next request.
- **Cross-tab sync.** Signing out in one tab signs out the others.

`localStorage.user` remains the single source of truth for the token — the axios interceptor reads
it directly, so a request can never carry a token the provider has already discarded.

## 4.5 Post-form context

The create form and the edit form are still the same component, but the mode is now explicit:

```ts
interface PostFormState {
  mode: 'create' | 'edit';
  postId: string | null;
  data: { message: string; tags: string; image: string };
}
```

`PostModal` calls `startEditing(post)` and then scrolls to `#newPost`; `PostForm` reads `mode` to
decide between `useCreatePost` and `useEditPost`, and calls `reset()` afterwards.

## 4.6 Components of note

| Component | Role |
| --- | --- |
| `Navbar` | Brand, scroll-to-composer button, home link, avatar → portal menu (Profile / Logout) |
| `AuthForm` | Sign-in/sign-up toggle, validation, error toasts |
| `GoogleSignInButton` | Isolated so `useGoogleLogin` only mounts when a client ID exists — otherwise Google's script throws and takes down the page |
| `Post` | Card: author, relative time, tags, image, caption, like/comment/share, `…` menu |
| `PostModal` | Portal menu: View, Edit (owner), Copy Link, Delete (owner) |
| `Comments` | Lazy thread — `useComments` only runs once opened |
| `UI/Form/Image` | compressorjs (quality 0.6) → base64; uses `useId` so two uploaders can coexist |
| `UI/Popups` | `notifySuccess` / `notifyError` / `notifyWarning` / `confirmAction` wrappers |
| `UI/HashLink/useScrollToHash` | Replaces the unmaintained, untyped `react-router-hash-link` |

## 4.7 Notifications

Toasts are fired from **event handlers and mutation callbacks**, never during render. The old code
called `Notification.fire()` in the body of `HomePage` and `Auth` and passed messages between pages
through router state; that is gone.

## 4.8 Build output

`vite.config.ts` splits vendors so app code can be cached independently:

| Chunk | Gzipped |
| --- | --- |
| `react-vendor` | ~60 kB |
| `router` | ~30 kB |
| `sweetalert` | ~21 kB |
| `query` | ~10 kB |
| app code | ~42 kB |

A production build takes about a second, versus roughly 40 seconds under CRA.
