# Smart Campus Companion (SCC) | System Documentation 📖

## 1. System Overview
Smart Campus Companion (SCC) is a centralized digital ecosystem for university students and faculty. It integrates real-time collaboration, academic management, and AI-driven assistance into a single, cohesive platform.

### Core Philosophy
- **Real-time First**: Every interaction (chat, notifications, status updates) is driven by WebSockets.
- **Cinematic UI**: A premium user experience using high-end CSS transitions and a custom design system.
- **Modular Scalability**: Features like "Kuppi", "Notes", and "Timetable" are built as independent modules but share a unified state and design language.

---

## 2. Technology Stack

### Frontend (The User Experience)
- **Framework**: `React 18` (Vite)
- **State Management**: `Redux Toolkit` (RTK) for global state and persistence.
- **Routing**: `React Router v6` with protected route wrappers.
- **Real-time**: `Socket.io-client` for bidirectional communication.
- **UI Framework**: `Semantic UI React` for robust component primitives.
- **Styling**: Vanilla CSS with a bespoke token system and **Desi UI Animations**.

### Backend (The Logic Engine)
- **Runtime**: `Node.js`
- **Framework**: `Express.js`
- **Database**: `MongoDB` with `Mongoose` ODM.
- **Authentication**: `Passport.js` / Custom `JWT` logic with Refresh Token rotation.
- **Real-time**: `Socket.io` with a centralized event-handler architecture.

---

## 3. Design System: "Forest Lumière & Noir"

The SCC design system is built on a custom CSS token architecture defined in `index.css`.

### Theme Engine
The system supports two primary modes:
- **Forest Lumière**: A clean, high-contrast light mode inspired by morning mist.
- **Forest Noir**: A deep, cinematic dark mode inspired by midnight forests, utilizing electric emerald and indigo accents.

### Desi UI Animation System
A unique set of animations inspired by Indian traditional motifs:
- `rangoliSpin`: A rotating geometric pattern for loaders.
- `diyaGlow`: A warm, pulsing shadow effect for primary actions.
- `garbaFlow`: Multi-axis circular motion for dynamic entrance.
- `paisleyFloat`: Gentle, organic floating motion for cards.

---

## 4. Module Deep-Dives

### 4.1 Engagement Engine (Kuppi Module)
"Kuppi" is a peer-teaching marketplace where students can share knowledge.
- **Logic**: Students post "Kuppi Calls" (subjects they can teach or need help with).
- **Application Flow**: Users apply to calls; authors can review applicants in real-time.
- **Data Model**: `KuppiPost` and `KuppiApplicant` models linked by `postId`.

### 4.2 Collaboration Suite (Groups & Chat)
- **Persistence**: Chat messages are stored in MongoDB and broadcasted via Sockets.
- **File Sharing**: Integrated file upload and retrieval system within group contexts.
- **Virtual Discovery**: Users can browse public groups or create private study circles.

### 4.3 Intelligence Archives (Notes)
- **Management**: A structured repository for academic papers, lecture notes, and summaries.
- **Social Features**: Commenting and reaction systems on individual notes.
- **Roadmap**: Direct integration with **OneDrive** and **Notebook LM** for AI-assisted study.

### 4.4 Academic Pulse (Timetable)
- **Visual Matrix**: A high-end calendar component that visualizes weekly schedules.
- **Automation**: Conflict detection for overlapping lectures.
- **Integration**: Supports **Google Calendar** sync hooks.

---

## 5. Security & Session Management

### 5.1 Dual-Token Authentication
- **Access Token**: Short-lived (15m) JWT passed in `Authorization` headers.
- **Refresh Token**: Long-lived (7d) token stored in secure, HttpOnly cookies for automatic session renewal.

### 5.2 Role-Based Access Control (RBAC)
Routes and UI components are gated based on user roles:
- `student`: Standard access to all peer features.
- `teacher`: Additional access to resource management and verified post status.
- `admin`: Full system control via the **Admin Dashboard**.

### 5.3 Automatic Session Logout
To protect student data on public campus computers, SCC monitors user activity (mouse moves, key presses). If no activity is detected for `30 minutes`, the system automatically clears tokens and logs the user out.

---

## 6. Real-time Event Architecture (Socket.io)

Events are categorized into namespaces:
- `auth`: Connection and presence tracking.
- `chat`: Message delivery and "typing..." indicators.
- `notifications`: Real-time alerts for likes, comments, and applications.
- `group`: Live updates to group membership and file uploads.

---

## 7. Data Schemas (Simplified)

| Model | Key Fields | Purpose |
|-------|------------|---------|
| **User** | `name`, `role`, `department`, `year` | Identity & Preferences |
| **Group** | `name`, `members`, `isPrivate`, `category` | Collaboration unit |
| **Message** | `sender`, `content`, `groupId` | Communication history |
| **KuppiPost**| `title`, `author`, `status`, `expiresAt` | Peer learning listing |
| **Note** | `fileUrl`, `author`, `tags`, `reactions` | Knowledge sharing |

---

## 8. Deployment & CI/CD
- **Frontend**: Hosted on `Vercel` for global CDN delivery.
- **Backend**: Deployed on `Render` or `Railway` using Docker containers.
- **Database**: Managed `MongoDB Atlas` cluster.

---

*Last Updated: April 2026*
