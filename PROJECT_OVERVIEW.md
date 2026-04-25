# Smart Campus Companion (SCC) - Complete Project Overview

## **Project Vision & Core Philosophy**
Smart Campus Companion is a comprehensive digital ecosystem for university students and faculty that integrates real-time collaboration, academic management, and AI-driven assistance into a single platform.

**Core Principles:**
- **Real-time First**: Every interaction driven by WebSockets
- **Cinematic UI**: Premium UX with high-end CSS transitions and custom design system
- **Modular Scalability**: Independent modules sharing unified state and design language

---

## **Technology Architecture**

### **Frontend Stack**
- **Framework**: React 19 + Vite 7
- **State Management**: Redux Toolkit (RTK) with persistence
- **Routing**: React Router v7 with protected route wrappers
- **Real-time**: Socket.io-client for bidirectional communication
- **UI Framework**: Semantic UI React + Custom CSS tokens
- **Animations**: GSAP, Three.js for 3D components
- **Charts**: Recharts for data visualization
- **Additional**: React Flow for diagrams, Lucide React icons

### **Backend Stack**
- **Runtime**: Node.js + Express 5
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with refresh token rotation
- **Real-time**: Socket.io server
- **File Handling**: Multer for uploads
- **Integrations**: Google APIs, OpenAI, Google Cloud Vision, Tesseract.js OCR
- **Documentation**: Swagger/OpenAPI with interactive UI
- **Background Jobs**: Scheduled tasks for maintenance

---

## **Core Features & Modules**

### **1. Authentication & User Management**
- **Dual-token system**: Access tokens (15min) + Refresh tokens (7d)
- **OAuth integration**: Google OAuth support
- **Role-based access**: Student, Teacher, Admin roles
- **Auto-logout**: 30-minute inactivity detection
- **Profile management**: Complete user profile CRUD

### **2. Kuppi Module (Peer-Teaching Marketplace)**
- **Kuppi Posts**: Students create teaching/learning requests
- **Application System**: Apply to teach/learn specific subjects
- **Real-time Management**: Live applicant tracking and approval
- **Auto-archival**: Automatic cleanup of expired posts
- **Export Features**: Download applicant data

### **3. Collaboration Suite (Groups & Chat)**
- **Group Management**: Create public/private study groups
- **Role Hierarchy**: Creator, Admin, Member permissions
- **Real-time Chat**: Socket.io powered messaging
- **File Sharing**: Upload and share files within groups
- **Activity Logging**: Track all group activities
- **Invite System**: Member invitations with acceptance/decline

### **4. Notes & Resources**
- **Knowledge Repository**: Upload and organize academic content
- **Social Features**: Comments and reactions on notes
- **Search Functionality**: Advanced search across all content
- **OCR Integration**: Extract text from images using Tesseract.js
- **AI Processing**: Google Cloud Vision for content analysis

### **5. Timetable & Academic Management**
- **Visual Calendar**: Matrix-based weekly schedule view
- **Google Calendar Sync**: Two-way synchronization
- **Conflict Detection**: Automatic overlap identification
- **AI Optimization**: Smart schedule generation
- **Semester Management**: Bulk semester timetable operations

### **6. Meetups & Events**
- **Event Creation**: Schedule study sessions and meetings
- **Voting System**: Group members can vote on meetup times
- **Auto-cancellation**: Cancel unconfirmed events
- **Real-time Updates**: Live status changes

### **7. Polls & Surveys**
- **Group Polls**: Create and manage polls within groups
- **Voting System**: Secure voting with results tracking
- **Real-time Results**: Live vote counting

### **8. Notifications System**
- **Real-time Alerts**: Socket.io powered instant notifications
- **Batch Management**: Mark all as read functionality
- **Activity Tracking**: Monitor user interactions

### **9. AI Assistant**
- **Chat Interface**: Integrated AI chat functionality
- **Study Assistance**: AI-powered study guidance
- **Content Analysis**: Process and analyze academic content
- **Multiple Models**: Support for various AI providers

### **10. Admin Dashboard**
- **System Analytics**: Comprehensive usage statistics
- **User Management**: View and manage all users
- **Content Moderation**: Manage notes, groups, and kuppi posts
- **System Health**: Monitor application performance

---

## **Data Models & Architecture**

### **Core Models**
- **User**: Authentication, profile, roles, refresh tokens
- **Group**: Collaboration units with membership hierarchy
- **Message**: Chat history with reactions
- **KuppiPost/KuppiApplicant**: Peer-teaching marketplace
- **Note**: Knowledge sharing with social features
- **Timetable/SemesterTimetable**: Academic scheduling
- **File**: File management with metadata
- **Notification**: Real-time alert system
- **Poll**: Voting and survey system
- **Meeting/Meetup**: Event management

### **Security Features**
- **JWT Authentication**: Dual-token system with rotation
- **Role-Based Access**: Granular permissions by role
- **Data Sanitization**: Automatic removal of sensitive fields
- **CORS Protection**: Configured origin allow-list
- **Input Validation**: Comprehensive request validation

---

## **API Endpoints Overview**

### **Authentication** (`/api/auth`)
- Registration, login, logout, profile management
- Google OAuth integration
- Token refresh and validation

### **Groups** (`/api/groups`)
- CRUD operations for groups
- Member management and role changes
- Invite system and activity tracking

### **AI Features** (`/api/ai`)
- Chat interface and model management
- Content processing and analysis

### **Admin** (`/api/admin`)
- System analytics and health monitoring
- User and content management

### **Academic Features**
- **Timetable**: `/api/timetable`, `/api/semester-timetables`
- **Exams**: `/api/exams` with preparation tracking
- **Study Pilot**: `/api/study-pilot` for AI study assistance

### **Content Management**
- **Notes**: `/api/notes` with social features
- **Files**: `/api/files` with upload/download
- **Resources**: `/api/resources` for academic materials
- **Kuppi**: `/api/kuppi` for peer-teaching

---

## **Real-time Architecture**

### **Socket.io Events**
- **Connection Management**: User presence tracking
- **Room System**: Personal rooms and group channels
- **Real-time Updates**: Chat, notifications, activity feeds
- **Event Categories**: Auth, chat, notifications, group updates

### **Background Jobs**
- **Kuppi Archival**: Automatic cleanup of expired posts
- **Meetup Management**: Auto-cancellation of unconfirmed events
- **System Maintenance**: Periodic data cleanup and optimization

---

## **Design System: "Forest Lumière & Noir"**

### **Theme Engine**
- **Forest Lumière**: Clean, high-contrast light mode
- **Forest Noir**: Cinematic dark mode with emerald/indigo accents

### **Custom Animations ("Desi UI")**
- `rangoliSpin`: Rotating geometric patterns for loaders
- `diyaGlow`: Warm pulsing effects for actions
- `garbaFlow`: Multi-axis circular motion for entrances
- `paisleyFloat`: Organic floating motion for cards

### **CSS Architecture**
- Token-based design system
- Modular CSS organization
- Responsive design principles
- Animation performance optimization

---

## **Development & Deployment**

### **Development Setup**
- **Monorepo Structure**: Frontend + Backend in single repository
- **Concurrent Development**: Run both stacks simultaneously
- **Hot Reloading**: Vite for frontend, Nodemon for backend
- **Environment Management**: Separate .env files for each stack

### **API Documentation**
- **Swagger UI**: Interactive API testing at `/api/docs`
- **OpenAPI Spec**: Machine-readable documentation at `/api/docs.json`
- **Postman Collection**: Complete API request collection

### **Deployment Ready**
- **Frontend**: Optimized for Vercel deployment
- **Backend**: Docker-ready for Render/Railway
- **Database**: MongoDB Atlas integration
- **CI/CD**: Scripts for seeding and testing

---

## **Advanced Features**

### **AI Integration**
- **OpenAI**: Chat completion and content analysis
- **Google Cloud Vision**: Image processing and OCR
- **Tesseract.js**: Client-side text extraction
- **Generative AI**: Study content generation

### **File Processing**
- **PDF Handling**: PDF parsing and manipulation
- **Image Processing**: OCR and vision analysis
- **Document Conversion**: Multiple format support
- **Storage Management**: Efficient file organization

### **Calendar Integration**
- **Google Calendar**: Two-way synchronization
- **Conflict Resolution**: Smart scheduling algorithms
- **Import/Export**: Calendar data management
- **Recurring Events**: Support for periodic activities

---

## **System Monitoring & Analytics**

### **Health Checks**
- **API Health**: `/api/health` endpoint
- **Database Status**: Connection monitoring
- **Service Dependencies**: Integration health tracking

### **Analytics Dashboard**
- **User Metrics**: Active users, engagement rates
- **Content Analytics**: Note usage, group activity
- **System Performance**: Response times, error rates
- **Feature Adoption**: Module usage statistics

---

## **Extensibility & Modularity**

### **Plugin Architecture**
- **Modular Design**: Each feature as independent module
- **Shared Services**: Common utilities and services
- **Event System**: Loose coupling via events
- **API Versioning**: Backward compatibility support

### **Scalability Features**
- **Database Indexing**: Optimized queries
- **Caching Strategy**: Response caching where appropriate
- **Background Processing**: Async job handling
- **Load Balancing Ready**: Stateless design principles

---

## **Repository Structure**

### **Root Level**
```
SCC/
├── frontend/          # React application
├── backend/           # Express API server
├── resources/         # Static assets
├── package.json       # Monorepo scripts
├── README.md          # Project documentation
├── CODEBASE_EXPLAINED.md  # Technical deep-dive
├── SYSTEM_DOCUMENTATION.md # System narrative
└── PROJECT_OVERVIEW.md    # This file
```

### **Backend Structure**
```
backend/src/
├── config/            # Database and app configuration
├── controllers/       # Business logic handlers
├── models/            # Mongoose schemas
├── routes/            # API endpoint definitions
├── middlewares/       # Auth, validation, error handling
├── services/          # Business logic services
├── utils/             # Helper utilities
├── jobs/              # Background tasks
├── sockets/           # Socket.io handlers
└── scripts/           # Database seeding scripts
```

### **Frontend Structure**
```
frontend/src/
├── pages/             # Route-level components
├── components/        # Reusable UI components
├── features/          # Redux slices by domain
├── services/          # API request wrappers
├── socket/            # Socket.io client
├── store/             # Redux store configuration
├── hooks/             # Custom React hooks
├── styles/            # CSS modules and themes
└── utils/             # Frontend utilities
```

---

## **Getting Started**

### **Prerequisites**
- Node.js 18+
- npm 9+
- MongoDB Atlas connection

### **Installation**
```bash
# Clone repository
git clone <repository-url>
cd SCC

# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
```

### **Environment Setup**
```bash
# Backend .env
MONGO_URI=<mongodb-connection-string>
PORT=5000
CLIENT_URL=http://localhost:5173

# Frontend .env (optional)
VITE_API_URL=http://localhost:5000
```

### **Running the Application**
```bash
# From root - runs both frontend and backend
npm run dev

# Or run individually
npm run backend    # Backend only
npm run frontend   # Frontend only
```

---

## **API Testing**

### **Swagger Documentation**
- Interactive UI: `http://localhost:5000/api/docs`
- OpenAPI Spec: `http://localhost:5000/api/docs.json`

### **Postman Collection**
Import `backend/POSTMAN_COLLECTION.json` for pre-configured API requests.

---

## **Key Dependencies**

### **Backend Core**
- `express`: Web framework
- `mongoose`: MongoDB ODM
- `socket.io`: Real-time communication
- `jsonwebtoken`: Authentication
- `bcryptjs`: Password hashing
- `multer`: File uploads

### **AI & Processing**
- `openai`: AI chat integration
- `@google-cloud/vision`: Image analysis
- `tesseract.js`: OCR functionality
- `pdf-parse`: PDF text extraction

### **Frontend Core**
- `react`: UI framework
- `@reduxjs/toolkit`: State management
- `react-router-dom`: Routing
- `socket.io-client`: Real-time client
- `axios`: HTTP requests

### **UI & Animations**
- `semantic-ui-css`: UI components
- `gsap`: Animation library
- `three`: 3D graphics
- `recharts`: Data visualization

---

## **Security Considerations**

### **Authentication**
- JWT with refresh token rotation
- Secure cookie handling
- Role-based access control
- OAuth integration support

### **Data Protection**
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration

### **File Security**
- File type validation
- Size limits enforcement
- Secure upload handling
- Malware scanning considerations

---

## **Performance Optimizations**

### **Frontend**
- Code splitting with React.lazy
- Image optimization
- Bundle size monitoring
- Service worker caching

### **Backend**
- Database indexing strategy
- Query optimization
- Response caching
- Connection pooling

### **Real-time**
- Socket room management
- Event throttling
- Memory-efficient data structures
- Connection limits

---

## **Monitoring & Logging**

### **Application Health**
- Health check endpoints
- Error tracking
- Performance metrics
- User activity logging

### **Database Monitoring**
- Connection status
- Query performance
- Index usage
- Storage optimization

---

*This is a production-ready, enterprise-level campus collaboration platform with comprehensive features for modern academic environments. The system combines cutting-edge web technologies with thoughtful UX design to create a seamless educational experience.*

---

*Last Updated: April 2026*
