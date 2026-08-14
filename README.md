# TweetMate

TweetMate is a small social media application: users sign up (email/password or Google), publish
image posts with captions and tags, like and comment on them, share them, and browse each other's
profiles.

Built with **React 19 + Vite 8 + TypeScript** on the front end and **Express 5 + Mongoose 9 +
TypeScript** on the back end.

## Documentation

In-depth architecture docs with diagrams live in [`docs/`](./docs/README.md):

| Doc | Contents |
| --- | --- |
| [Architecture](./docs/01-architecture.md) | Tech stack, deployment topology, repo layout, local setup |
| [Data model](./docs/02-data-model.md) | Mongoose schemas, ER diagram, read-time hydration |
| [API reference](./docs/03-api-reference.md) | Every endpoint, auth requirements, payloads |
| [Frontend & state](./docs/04-frontend-and-state.md) | Component tree, routes, React Query cache, Contexts |
| [Key flows](./docs/05-key-flows.md) | Sequence diagrams for auth, posting, liking, commenting, profiles |
| [Gotchas](./docs/06-gotchas.md) | Remaining sharp edges and what to tackle next |

## Requirements

- **Node.js 20.19+** (required by Vite 8 and Mongoose 9)
- A MongoDB connection string — or use `npm run dev:memory` and skip it
- A Google OAuth Client ID, if you want Google sign-in

## Installation

```bash
git clone https://github.com/snrp2002/TweetMate.git
cd TweetMate

cd server && npm install
cd ../client && npm install
```

### Server configuration

Copy `server/.env.example` to `server/.env` and fill it in:

| Key | Required | Purpose |
| --- | :---: | --- |
| `DATABASE_URL` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Secret used to sign and verify JWTs |
| `PORT` | no | Defaults to `5000` |
| `CORS_ORIGINS` | no | Comma-separated allowlist. Unset means any origin |

### Client configuration

Copy `client/.env.example` to `client/.env` if you need to override the defaults:

| Key | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:5000` | API origin |
| `VITE_GOOGLE_CLIENT_ID` | *(empty)* | Google OAuth client ID. The Google button is hidden when unset |
| `VITE_SHARE_BASE_URL` | current origin | Origin used for shareable post links |

## Usage

```bash
# API on http://localhost:5000
cd server && npm run dev

# ...or without a local MongoDB (throwaway in-memory database)
cd server && npm run dev:memory

# Client on http://localhost:3000
cd client && npm run dev
```

## Scripts

### `server/`

| Script | Purpose |
| --- | --- |
| `npm run dev` | Watch mode via `tsx` |
| `npm run dev:memory` | Watch mode against an in-memory MongoDB |
| `npm test` | End-to-end smoke suite (47 assertions, spins up its own database) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run the compiled server |

### `client/`

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Typecheck, then build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |

## Features

1. Authentication with JSON Web Tokens, plus Google OAuth
2. Creating, editing, deleting and sharing posts
3. Liking, unliking and commenting
4. User profiles with an editable bio and avatar

## Technologies

**Client:** TypeScript, React 19, Vite 8, React Router 7, TanStack Query 5, Axios, SweetAlert2,
date-fns, compressorjs, react-share

**Server:** TypeScript, Node.js, Express 5, Mongoose 9, JSON Web Tokens, bcryptjs
