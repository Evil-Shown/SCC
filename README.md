# Smart Campus Companion (SCC) 

[![Status](https://img.shields.io/badge/Status-Operational-success.svg)]()
[![License](https://img.shields.io/badge/License-MIT-blue.svg)]()
[![Tech](https://img.shields.io/badge/Stack-MERN%20+%20Socket.io-orange.svg)]()

> **The ultimate digital ecosystem for modern campus life.** Smart Campus Companion (SCC) is an AI-powered, real-time collaboration platform designed to streamline academic workflows, foster peer-to-peer learning, and centralize student resources.

---

##  Features at a Glance

###  Deep-Seated Dashboard
A cinematic, high-performance command center featuring:
- **Visual Matrix**: Real-time academic tracking and timetable visualization.
- **Activity Stream**: Instant updates on group chats, notes, and notifications.
- **Theme Engine**: Seamless transition between *Forest Lumière* (Light) and *Forest Noir* (Dark) modes.

###  AI-Powered Intelligence
- **AI Chat**: Context-aware assistant for academic queries.
- **Smart Scheduling**: Visual timetable management with automated conflict resolution (In-progress).
- **Intelligence Archives**: A robust repository for notes and resources with future OneDrive integration.

###  Peer Collaboration (The Kuppi Module)
- **Marketplace for Learning**: Post and apply for "Kuppi" (peer teaching) sessions.
- **Real-time Groups**: Fully functional group hubs with persistent chat and file sharing.
- **Global Reach**: Connect with tutors and students across departments.

###  Enterprise-Grade Security
- **JWT Refresh Cycle**: Dual-token authentication system (Access + Refresh).
- **RBAC**: Role-based access control (Student, Teacher, Admin).
- **Session Protection**: Automatic logout on inactivity for maximum security.

---

##  Technical Architecture

SCC is built on a modern, distributed architecture designed for scalability and real-time performance.

### The Stack
- **Frontend**: `React.js` (Vite) + `Redux Toolkit` (State) + `Semantic UI` + `Socket.io-client`.
- **Backend**: `Node.js` + `Express` + `MongoDB` (Mongoose).
- **Communication**: Bidirectional event-driven communication via `Socket.io`.
- **Styling**: Advanced CSS-in-JS tokens with a custom **Desi UI Animation System**.

> [!IMPORTANT]
> For a deep dive into the system's inner workings, data models, and implementation details, please refer to the [System Documentation](file:///d:/Coding/SCC/SYSTEM_DOCUMENTATION.md).

---

##  Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB)

### Installation

1. **Clone & Install**
   ```bash
   git clone https://github.com/Evil-Shown/SCC.git
   cd SCC
   npm install # Install root dependencies
   ```

2. **Backend Configuration**
   ```bash
   cd backend
   cp .env.example .env # Create your environment file
   npm install
   npm run dev
   ```

   For Google sign-in/register, add these variables to `backend/.env` and register the callback URI in Google Cloud Console:
   ```bash
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
   CLIENT_URL=http://localhost:5173
   ```

   Use the same Google OAuth app for both login and registration flows.

3. **Frontend Configuration**
   ```bash
   cd ../frontend
   cp .env.example .env
   npm install
   npm run dev
   ```

---

## 📂 Project Structure

```text
SCC/
├── frontend/           # Vite + React Client
│   ├── src/
│   │   ├── components/ # Atomic UI & Business components
│   │   ├── features/   # Redux logic (Auth, Notes, etc.)
│   │   ├── socket/     # Real-time event handlers
│   │   └── pages/      # Compiled view layers
│
├── backend/            # Express Server
│   ├── src/
│   │   ├── controllers/# Business logic
│   │   ├── models/     # Mongoose Data Schemas
│   │   ├── routes/     # RESTful Endpoints
│   │   └── socket/     # Socket.io event emitters
│
└── resources/          # Shared assets and documentation
```

---

##  Contributing & Support

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

- **Found a bug?** Open an [Issue](https://github.com/Evil-Shown/SCC/issues).
- **Want to talk?** Email us at `support@scc.com`.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

© 2026 Smart Campus Companion Team. 

##  Additional Resources

- [React Documentation](https://react.dev)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org)
- [Express.js Documentation](https://expressjs.com)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Socket.io Documentation](https://socket.io/docs)
