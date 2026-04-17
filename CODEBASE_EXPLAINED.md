# SCC Codebase Explained

This is the engineering-level walkthrough of Smart Campus Companion (SCC), with a strong backend focus.

Think of this as a "senior engineer explaining to an intern" guide:

- what each layer is responsible for,
- how a request travels through the system,
- how core backend code is structured,
- where you should modify code safely,
- and where hidden risks usually live.

## 1) Big Picture: How the Monorepo Is Organized

SCC has two runnable apps and one orchestration root:

- frontend: React + Vite SPA.
- backend: Express + Socket.IO + MongoDB API server.
- root: scripts to run both projects together.

Principle: frontend and backend are decoupled at compile time and connected only by API/sockets at runtime.

## 2) Backend Architecture (Deep Dive)

Backend entrypoint: backend/src/server.js

At startup, server.js performs these steps in order:

1. Load environment config.
2. Build Express app + HTTP server.
3. Configure CORS and request parsers.
4. Register route modules.
5. Register 404 and error middleware.
6. Attach Socket.IO to the same HTTP server.
7. Connect MongoDB (hard requirement before serving API).
8. Sync critical indexes (User, Module).
9. Start periodic jobs.
10. Listen on PORT.

Key takeaway for interns: backend startup is intentionally "DB-first". If DB connection fails, the process exits. That avoids fake-green health where server is up but data layer is broken.

### 2.1 Backend Layer Responsibilities

Routes layer (backend/src/routes):

- declares HTTP verbs and endpoint paths,
- attaches middleware chain,
- forwards to controller functions.

Controllers layer (backend/src/controllers):

- implements use-case logic,
- validates business assumptions,
- interacts with models/services,
- shapes response payloads and status codes.

Models layer (backend/src/models):

- schema definition,
- indexes/constraints,
- model methods,
- persistence rules.

Middlewares layer (backend/src/middlewares):

- authentication/authorization,
- request validation,
- domain guard checks,
- upload and error normalization hooks.

Services and utils (backend/src/services, backend/src/utils):

- reusable domain helpers,
- token helpers,
- integration abstractions.

Jobs layer (backend/src/jobs):

- scheduled cleanup and background maintenance.

### 2.2 Request Lifecycle (What Actually Happens)

For a protected endpoint, typical execution path is:

1. Route match in Express.
2. route middleware (for example authenticate, then validator).
3. controller handler executes.
4. model query/write runs through Mongoose.
5. optional socket event emission to interested rooms.
6. JSON response sent.
7. if any throw/reject occurs, global error handler shapes response.

Mentoring note: route files should stay thin. If route files start doing business logic, move that logic into controller/service.

## 3) Backend Code Tour by Important Files

### 3.1 server.js (core runtime composition)

What to notice:

- CORS is allow-list based and supports several localhost Vite ports.
- /api/health is present and useful for diagnostics.
- Route mounting is mixed: some modules mounted with specific prefixes (for example /api/auth), others mounted at /api and define deeper paths internally.
- Multer errors are normalized before generic error fallback.
- Socket rooms use user and group namespacing.
- Background jobs include Kuppi archive logic and meetup auto-cancellation starter.

Why this matters:

- You can safely add a new route module in one place and keep boundaries clear.
- Errors should be thrown/returned in controllers, not swallowed silently.

### 3.2 config/db.js (robust MongoDB bootstrap)

What it does well:

- validates MONGO_URI/MONGODB_URI existence and format,
- handles common .env mistakes,
- supports DNS server override for problematic networks,
- enforces IPv4 family to avoid dual-stack issues,
- logs actionable troubleshooting hints on failure.

Intern lesson: this is a good example of "operator-friendly" code. It does not just fail; it teaches how to fix failure.

### 3.3 middlewares/auth.js (authentication gate)

Key behaviors:

- parses Bearer token from Authorization header,
- supports optional query token fallback for special flows,
- verifies JWT and hydrates req.user from DB,
- returns 401 for missing/invalid token/user,
- exports protect alias for ergonomic route usage.

Design implication:

- auth is centralized and consistent,
- role checks should happen after authenticate (when req.user exists).

### 3.4 middlewares/validation.js (input guard)

Current validations:

- validateRegister
- validateLogin

This file currently validates only auth payloads. Other domains use dedicated validators in separate middleware files.

### 3.5 models/User.js (auth and profile core)

Important features:

- unique email, optional unique sparse fields (phone, studentId),
- provider fields for local/google auth,
- refreshTokens array with TTL expiry behavior,
- pre-save password hashing,
- comparePassword method,
- toJSON sanitizer that strips secrets.

Intern lesson: never return raw Mongoose user documents directly unless you are sure sensitive fields are excluded.

### 3.6 models/Group.js (collaboration domain)

Important features:

- creator/admin/member design,
- soft-delete style via isActive,
- settings object (visibility, invite policy, max members),
- helper methods isMember, isAdmin, addMember, removeMember.

These helper methods reduce repeated role logic in controllers.

### 3.7 controllers/authController.js (reference controller quality)

Why this controller is a good learning sample:

- normalizes email consistently,
- handles duplicate key collisions explicitly,
- issues access+refresh tokens and persists refresh token state,
- supports Google OAuth bootstrap + callback,
- sanitizes output through model toJSON,
- exposes complete account lifecycle endpoints.

Improvement note for future work:

- deleteAccount currently has TODO for cascade deletion across related collections.

### 3.8 routes/groupRoutes.js + controllers/groupController.js (complex feature module)

This module demonstrates advanced backend patterns:

- layered validation middleware for create/update/invite/role changes,
- strict route ordering to avoid path conflicts,
- activity logging side-channel,
- socket event emission from controller actions,
- ownership/admin checks enforced at business logic level.

Intern lesson: this is one of the best places to study how SCC handles collaborative state changes.

## 4) Backend Inventory

### 4.1 Route modules

- adminRoutes.js
- aiRoutes.js
- assignmentRoutes.js
- authRoutes.js
- examRoutes.js
- fileRoutes.js
- groupRoutes.js
- kuppiRoutes.js
- meetingRoutes.js
- meetupRoutes.js
- messageRoutes.js
- moduleRoutes.js
- noteRoutes.js (currently empty)
- notesRoutes.js
- notificationRoutes.js
- pollRoutes.js
- resourceRoutes.js
- semesterTimetableRoutes.js
- studyPilotRoutes.js
- timetableRoutes.js

### 4.2 Controller modules

- adminController.js
- aiController.js
- assignmentController.js
- authController.js
- examPlanController.js
- fileController.js
- groupController.js
- kuppiController.js
- meetingController.js
- meetupController.js
- messageController.js
- moduleController.js
- noteController.js
- notesController.js
- notificationController.js
- pollController.js
- resourceController.js
- semesterTimetableController.js
- studyPilotController.js
- timetableController.js

### 4.3 Model modules

- Assignment.js
- Attendance.js
- CalendarSync.js
- Comment.js
- Exam.js
- File.js
- Group.js
- GroupActivity.js
- GroupInvite.js
- KuppiApplicant.js
- KuppiPost.js
- Meeting.js
- Message.js
- Module.js
- Note.js
- Notification.js
- Poll.js
- Reaction.js
- Resource.js
- SemesterTimetable.js
- StudyGroup.js
- Timetable.js
- TimetableSlot.js
- User.js

## 5) Endpoint Catalog (Backend)

Legend:

- Public: no auth middleware in route.
- Protected: requires authenticate/protect middleware.

Note: final path = mount prefix from server.js + route path below.

### 5.1 Auth module (/api/auth)

- GET /google/start (Public)
- GET /google/callback (Public)
- POST /register (Public, validation)
- POST /login (Public, validation)
- POST /refresh (Public)
- POST /logout (Protected)
- GET /me (Protected)
- PUT /profile (Protected)
- DELETE /account (Protected)

### 5.2 Admin module (/api/admin)

- GET /analytics
- GET /system-health
- GET /users
- PUT /users/:id
- DELETE /users/:id
- GET /groups
- DELETE /groups/:id
- GET /notes
- DELETE /notes/:id
- GET /kuppi
- DELETE /kuppi/:id

### 5.3 AI module (/api/ai)

- POST /chat
- GET /models

### 5.4 Group module (/api/groups)

- GET /users/search
- GET /invites/me
- PATCH /invites/:inviteId/accept
- PATCH /invites/:inviteId/decline
- GET /
- POST /
- GET /:groupId
- PUT /:groupId
- DELETE /:groupId
- POST /:groupId/join
- POST /:groupId/leave
- DELETE /:groupId/members/:memberId
- PUT /:groupId/members/:memberId/role
- POST /:groupId/transfer-ownership
- POST /:groupId/invites
- GET /:groupId/invites
- PATCH /:groupId/invites/:inviteId/revoke
- GET /:groupId/activity

### 5.5 Generic /api mounted modules

Files and messages:

- POST /groups/:groupId/files
- GET /groups/:groupId/files
- GET /files/:fileId
- GET /files/:fileId/download
- DELETE /files/:fileId
- POST /groups/:groupId/messages
- GET /groups/:groupId/messages
- PUT /messages/:messageId
- DELETE /messages/:messageId
- POST /messages/:messageId/reactions
- DELETE /messages/:messageId/reactions

Notes and notifications:

- POST /notes
- GET /notes
- GET /notes/my
- GET /notes/search
- POST /notes/react
- POST /notes/comment
- PUT /notes/:noteId
- DELETE /notes/:noteId
- GET /notes/:noteId/comments
- GET /notifications
- PATCH /notifications/read-all
- PATCH /notifications/:id/read

Kuppi and meetups:

- POST /kuppi
- PUT /kuppi/:postId
- GET /kuppi
- GET /kuppi/my/logs
- POST /kuppi/apply
- PATCH /kuppi/:postId/link
- DELETE /kuppi/:postId
- GET /kuppi/applicants/:postId
- GET /kuppi/export/:postId
- POST /groups/:groupId/meetups
- GET /groups/:groupId/meetups
- GET /meetups/:id
- POST /meetups/:id/activate
- POST /meetups/:id/vote
- POST /meetups/:id/complete

Modules/resources/polls:

- GET /modules
- POST /modules
- PATCH /modules/:id
- DELETE /modules/:id
- GET /resources
- POST /resources
- DELETE /resources/all
- PATCH /resources/:id
- DELETE /resources/:id
- POST /resources/import
- POST /groups/:groupId/polls
- GET /groups/:groupId/polls
- POST /polls/:pollId/vote
- PUT /polls/:pollId
- DELETE /polls/:pollId

Timetable and semester timetable:

- GET /timetable/google-callback
- GET /timetable/google-auth-url
- GET /timetable/google-status
- GET /timetable/google-events
- GET /timetable/ongoing
- POST /timetable
- POST /timetable/generate
- POST /timetable/sync-google
- POST /timetable/ai-chat
- POST /timetable/import-timetable
- DELETE /timetable/me
- DELETE /timetable
- POST /timetable/clear-my-data
- POST /timetable/clear-optimized
- GET /timetable/:userId
- POST /semester-timetables
- GET /semester-timetables
- GET /semester-timetables/:id
- DELETE /semester-timetables/:id
- POST /semester-timetables/:id/slots
- PATCH /semester-timetables/:id/slots/:slotId
- DELETE /semester-timetables/:id/slots/:slotId

### 5.6 Exam module (/api/exams)

- GET /
- POST /
- GET /overview
- POST /roadmap
- POST /ai-assistant
- POST /setup
- PATCH /:examId/preparation
- PATCH /:examId/roadmap-status
- PATCH /:examId
- DELETE /:examId

### 5.7 Study Pilot module (/api/study-pilot)

- POST /generate

## 6) Realtime Architecture

Socket server is attached directly to the HTTP server instance.

Core socket events observed in server entrypoint:

- join-room: socket joins a user-specific room.
- join-group: socket joins group-{groupId} room.
- leave-group: socket leaves that group room.
- disconnect: connection lifecycle cleanup.

In group controller, activity and membership updates emit events back into group rooms. This is the bridge between REST writes and realtime UI updates.

## 7) Background Jobs and Automation

Two startup-triggered periodic behaviors are visible:

1. Kuppi post archival loop in server.js (every minute).
2. Meetup overdue auto-cancellation via jobs/meetupJobs.js (immediate run + hourly interval).

Operational note: these jobs run inside the API process. If you scale multiple backend replicas, each replica will run the same intervals unless coordinated externally.

## 8) Security Model: What to Teach New Engineers

Authentication:

- Access token (short-lived) and refresh token (long-lived).
- Refresh token is persisted in User.refreshTokens and checked during refresh flow.

Authorization:

- Role-aware access through authorize middleware helper and feature-specific checks.
- Group-specific authorization mostly enforced in groupController via group.isAdmin or ownership checks.

Data safety:

- password and token-like fields are excluded through select:false and toJSON sanitization.

Important implementation nuance:

- middlewares/roleMiddleware.js currently exists but is empty.
- routes/noteRoutes.js currently exists but is empty and not mounted.

Those are not runtime blockers, but they are maintenance smells and should either be implemented or removed in cleanup work.

## 9) Frontend Architecture (Concise)

Main folders:

- pages: route-level screens.
- components: composable UI/domain widgets.
- features: Redux slices by business domain.
- services: HTTP request wrappers.
- socket: realtime client integration.
- styles: css modules by page/feature.
- hooks/utils: reusable behavior and utilities.

Data flow pattern:

1. page/component dispatches thunk/action.
2. service calls backend endpoint.
3. slice updates state.
4. component re-renders via selector.
5. socket events patch state for realtime updates.

## 10) How to Add a New Backend Feature (Senior Checklist)

When you add a feature, follow this order:

1. Create/extend model schema and indexes.
2. Add controller with clear success and failure branches.
3. Add route definitions with middleware sequence.
4. Register route module in server.js.
5. Add tests or at least manual API verification list.
6. Add frontend service + slice + UI integration.
7. Update this document endpoint catalog.

Code review expectations:

- no business logic in routes,
- no secret fields leaking in responses,
- no broad try/catch that hides useful errors,
- status codes must match behavior,
- authorization checks must be explicit for mutating operations.

## 11) Debugging Playbook

If backend does not start:

1. Validate MONGO_URI format and credentials.
2. Check Atlas network allow list.
3. Try MONGO_DNS_SERVERS for DNS/SRV failures.
4. Verify PORT is free.

If auth fails unexpectedly:

1. Verify Authorization header format (Bearer token).
2. Check token expiry.
3. Check user still exists.
4. Check refresh token exists in DB for refresh flow.

If group actions fail:

1. Confirm membership and role (owner/admin/member).
2. Validate group isActive and not soft-deleted.
3. Confirm request passed route validators.

If realtime appears broken:

1. Confirm frontend joined correct room names.
2. Confirm backend emits to same room convention.
3. Confirm CORS and socket origin rules allow your frontend host.

## 12) Related Documents

- [README.md](README.md)
- [SYSTEM_DOCUMENTATION.md](SYSTEM_DOCUMENTATION.md)
- [backend/ARCHITECTURE.md](backend/ARCHITECTURE.md)

