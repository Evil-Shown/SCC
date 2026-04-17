# Smart Campus Companion (SCC)

[![Status](https://img.shields.io/badge/Status-Active-success.svg)]()
[![License](https://img.shields.io/badge/License-MIT-blue.svg)]()
[![Monorepo](https://img.shields.io/badge/Repo-Frontend%20%2B%20Backend-orange.svg)]()

Smart Campus Companion is a full-stack campus collaboration platform that combines:

- academic note/resource sharing,
- study-group coordination,
- real-time chat and notifications,
- timetable and meetup workflows,
- role-aware admin capabilities,
- AI-assisted features.

This repository is a JavaScript monorepo with a Vite + React frontend and an Express + MongoDB backend.

## Table of Contents

- [Architecture Snapshot](#architecture-snapshot)
- [Tech Stack](#tech-stack)
- [Repository Layout](#repository-layout)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Runtime Behavior](#runtime-behavior)
- [API and Realtime Overview](#api-and-realtime-overview)
- [Operational Troubleshooting](#operational-troubleshooting)
- [Documentation Map](#documentation-map)
- [Scripts Reference](#scripts-reference)
- [License](#license)

## Architecture Snapshot

SCC follows a layered architecture with strict functional separation:

1. Presentation Layer (frontend): routes, pages, components, local UX state.
2. Application State Layer (frontend): Redux slices and async action orchestration.
3. Transport Layer: Axios HTTP for REST + Socket.IO for event-driven realtime.
4. API Layer (backend): Express route modules and middleware composition.
5. Domain Layer (backend): controllers and services for use-case logic.
6. Data Layer (backend): Mongoose models on MongoDB Atlas.
7. Background Processing: scheduled jobs for automated housekeeping.

The backend blocks server startup until MongoDB is connected. This prevents partially alive API states.

## Tech Stack

Frontend (frontend):

- React 19 + Vite 7
- Redux Toolkit
- React Router
- Axios
- Socket.IO Client
- GSAP, Three.js, Recharts, Semantic UI CSS

Backend (backend):

- Node.js + Express 5
- MongoDB + Mongoose
- Socket.IO Server
- JWT-based auth flow
- Multer file handling
- Nodemailer / Google APIs / OpenAI integrations

Monorepo tooling (root):

- concurrently for running frontend + backend together

## Repository Layout

Top-level:

- frontend: React app, pages, components, hooks, state, services, styles.
- backend: Express app, API routes, controllers, models, middleware, jobs.
- resources: static/support resources.
- SYSTEM_DOCUMENTATION.md: product/system narrative documentation.
- CODEBASE_EXPLAINED.md: deep technical map for developers.

High-value subfolders:

- frontend/src/pages: route-level views.
- frontend/src/features: Redux slices by domain.
- frontend/src/services: API request modules.
- frontend/src/socket: websocket client integration.
- backend/src/routes: endpoint registration per feature area.
- backend/src/controllers: request orchestration and domain logic.
- backend/src/models: Mongo schemas and indexes.
- backend/src/middlewares: auth, validation, role checks, error handling.
- backend/src/jobs: periodic maintenance tasks.

## Local Development

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas connection string

### 1) Install dependencies

From repository root:

   npm install

Install subproject dependencies (recommended first run):

   cd backend
   npm install
   cd ../frontend
   npm install

### 2) Configure backend environment

Create backend/.env and set at minimum:

   MONGO_URI=<mongodb or mongodb+srv connection string>
   PORT=5000
   CLIENT_URL=http://localhost:5173

Optional but commonly needed:

   NODE_ENV=development
   GOOGLE_CLIENT_ID=<google oauth client id>
   GOOGLE_CLIENT_SECRET=<google oauth secret>
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
   MONGO_DNS_SERVERS=8.8.8.8,1.1.1.1

### 3) Configure frontend environment

Create frontend/.env if needed:

   VITE_API_URL=http://localhost:5000

Notes:

- In Vite dev mode, frontend/src/config/apiBase.js defaults to same-origin + proxy style behavior when VITE_API_URL is not set.
- In non-dev mode, fallback points to http://localhost:5000 if VITE_API_URL is missing.

### 4) Run in development

From repository root:

   npm run dev

This launches backend and frontend concurrently.

Health checks:

- API root: GET /
- API health: GET /api/health

## Environment Variables

Backend critical variables:

- MONGO_URI or MONGODB_URI: MongoDB connection (required).
- PORT: backend listening port (default 5000).
- CLIENT_URL: allowed frontend origin used by CORS.
- NODE_ENV: runtime environment label.

Backend integration variables (feature-dependent):

- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_REDIRECT_URI
- OPENAI key and provider settings (if AI features are enabled in your deployment)

Frontend variables:

- VITE_API_URL: explicit API base URL for deployed frontend builds.

## Runtime Behavior

Startup sequence (backend):

1. Load environment.
2. Connect to MongoDB.
3. Sync selected indexes (User, Module).
4. Register routes and middleware.
5. Start background jobs.
6. Start HTTP + Socket.IO listeners.

CORS and dev ports:

- Backend allows configured CLIENT_URL and common localhost Vite ports (5173-5175) in server configuration.

Error model:

- 404 fallback returns JSON payload.
- Multer errors are normalized (including file-size violations).
- Unhandled errors return status-aware JSON messages.

## API and Realtime Overview

Registered backend API groups include:

- /api/auth
- /api/groups
- /api/exams
- /api/study-pilot
- /api/ai
- /api/admin
- plus additional mounted feature routes for files, notes, notifications, polls, timetable, meetups, resources, modules, and semester timetable.

Socket.IO events include:

- join-room (personal room by user id)
- join-group (group scoped channel)
- leave-group

## Operational Troubleshooting

### MongoDB connection fails

Checklist:

1. Verify MONGO_URI format starts with mongodb:// or mongodb+srv://.
2. Confirm Atlas Network Access includes your IP.
3. Validate credentials in the URI.
4. If SRV lookup fails on Windows/restricted DNS, set MONGO_DNS_SERVERS.

### Port already in use

If backend port is occupied, change PORT in backend/.env or stop the conflicting process.

### CORS blocked in browser

Confirm frontend origin matches CLIENT_URL or is one of allowed localhost ports configured by backend.

## Documentation Map

- System narrative and module descriptions: [SYSTEM_DOCUMENTATION.md](SYSTEM_DOCUMENTATION.md)
- Deep technical codebase guide: [CODEBASE_EXPLAINED.md](CODEBASE_EXPLAINED.md)
- Backend architecture notes: [backend/ARCHITECTURE.md](backend/ARCHITECTURE.md)

## Scripts Reference

Root scripts:

- npm run dev: run backend + frontend concurrently.
- npm run backend: run backend dev server.
- npm run frontend: run frontend dev server.
- npm run seed:api: run backend API seeding.
- npm run seed:groups: run group/meetup seeding.

Backend scripts:

- npm run dev: nodemon on backend/src/server.js.
- npm run start: node backend/src/server.js.
- npm run seed:groups: execute backend/src/scripts/seedGroupsMeetups.js.
- npm run seed:api: execute backend/src/scripts/seedViaApi.js.

Frontend scripts:

- npm run dev: start Vite.
- npm run build: production build.
- npm run preview: preview built assets.
- npm run lint: lint frontend source.

## License

MIT License. See [LICENSE](LICENSE).
