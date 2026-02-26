# 🏗️ System Architecture - Smart Campus Companion Backend

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│  - Authentication UI                                             │
│  - Notes Interface                                               │
│  - Kuppi Platform                                                │
│  - File Sharing                                                  │
│  - Chat Interface                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/HTTPS + Socket.io
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS.JS SERVER (Port 5000)                 │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    MIDDLEWARE LAYER                     │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  • CORS                                                 │    │
│  │  • JSON Body Parser                                     │    │
│  │  • Request Logger                                       │    │
│  │  • JWT Authentication (protect)                         │    │
│  │  • Role Authorization (authorize)                       │    │
│  │  • Input Validation                                     │    │
│  │  • Error Handler                                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                      API ROUTES                         │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  /api/auth/*      → Authentication                      │    │
│  │  /api/notes/*     → Notes Management                    │    │
│  │  /api/kuppi/*     → Kuppi Platform                      │    │
│  │  /api/groups/*    → Group Management                    │    │
│  │  /api/messages/*  → Chat System                         │    │
│  │  /api/files/*     → File Sharing                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    CONTROLLERS                          │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  • authController    - User auth logic                  │    │
│  │  • notesController   - Notes CRUD & engagement          │    │
│  │  • kuppiController   - Kuppi & applicant management     │    │
│  │  • groupController   - Group operations                 │    │
│  │  • messageController - Chat operations                  │    │
│  │  • fileController    - File operations                  │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                   MONGOOSE MODELS                       │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  User, Note, Reaction, Comment, KuppiPost,              │    │
│  │  KuppiApplicant, Notification, Group, Message, File     │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MONGODB DATABASE                            │
│                                                                  │
│  Collections:                                                    │
│  • users               • reactions         • messages            │
│  • notes               • comments          • files               │
│  • kuppiposts          • notifications     • groups              │
│  • kuppiapplicants                                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                            │
│                                                                  │
│  • Email Service (SMTP/Gmail)  - Notifications                   │
│  • OneDrive API               - File storage                     │
│  • Google Calendar API        - Calendar sync                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

```
┌──────────┐                                           ┌──────────┐
│  Client  │                                           │  Server  │
└────┬─────┘                                           └────┬─────┘
     │                                                      │
     │  1. POST /api/auth/register                         │
     │     { name, email, password, role }                 │
     ├─────────────────────────────────────────────────────>│
     │                                                      │
     │                              2. Hash password        │
     │                              3. Create user in DB    │
     │                              4. Generate JWT tokens  │
     │                                                      │
     │  5. { user, accessToken, refreshToken }             │
     │<─────────────────────────────────────────────────────┤
     │                                                      │
     │  6. Store tokens in localStorage                    │
     │                                                      │
     │  7. POST /api/notes (with Authorization header)     │
     │     Authorization: Bearer <accessToken>             │
     ├─────────────────────────────────────────────────────>│
     │                                                      │
     │                              8. Verify JWT           │
     │                              9. Load user from DB    │
     │                              10. req.user = user     │
     │                              11. Execute controller  │
     │                                                      │
     │  12. { success: true, data: note }                  │
     │<─────────────────────────────────────────────────────┤
     │                                                      │
     │  When token expires (15 min):                       │
     │                                                      │
     │  13. POST /api/auth/refresh                         │
     │      { refreshToken }                               │
     ├─────────────────────────────────────────────────────>│
     │                                                      │
     │  14. { accessToken: newToken }                      │
     │<─────────────────────────────────────────────────────┤
     │                                                      │
```

---

## 📝 Notes System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        NOTES PLATFORM                            │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│     Note     │     │   Reaction   │     │   Comment    │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ • userId     │────<│ • userId     │     │ • userId     │
│ • title      │     │ • noteId     │────>│ • noteId     │
│ • description│     │ • type       │     │ • commentText│
│ • onedrive   │     │   (like/     │     │ • createdAt  │
│ • tags[]     │     │    dislike)  │     └──────────────┘
│ • reactions  │     └──────────────┘
│ • comments   │              │
└──────────────┘              │
       │                      │
       │                      │
       ▼                      ▼
┌──────────────────────────────────┐
│       Notification Model          │
│  • type: "note_reaction"          │
│  • type: "note_comment"           │
└──────────────────────────────────┘

Features:
✅ Create & view notes with tags
✅ Search across title, description, tags
✅ Like/dislike with toggle functionality
✅ Comments with real-time updates
✅ Notifications (email + in-app)
✅ User filtering
```

---

## 📚 Kuppi System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        KUPPI PLATFORM                            │
└─────────────────────────────────────────────────────────────────┘

┌────────────────┐           ┌──────────────────┐
│   KuppiPost    │           │  KuppiApplicant  │
├────────────────┤           ├──────────────────┤
│ • ownerId      │◄─────────┤ • postId         │
│ • title        │           │ • applicantId    │
│ • description  │           │ • name           │
│ • eventDate    │           │ • email          │
│ • meetingLink  │           │ • notificationSent│
│ • status       │           └──────────────────┘
│ • applicantsCount│                │
└────────────────┘                  │
       │                            │
       │                            │
       ▼                            ▼
┌─────────────────────────────────────────┐
│         MEETING LINK TRIGGER             │
│                                          │
│  When meetingLink added:                 │
│  1. Create notifications for applicants  │
│  2. Send email to all applicants         │
│  3. Update status to "scheduled"         │
│  4. Mark notificationSent = true         │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│         EXCEL EXPORT SERVICE             │
│                                          │
│  • Fetch all applicants                  │
│  • Generate professional Excel           │
│  • Include: name, email, student ID,     │
│    department, year, applied date        │
│  • Styled headers & formatting           │
└─────────────────────────────────────────┘

Workflow:
1. Teacher creates kuppi post (no meeting link yet)
2. Students apply to kuppi
3. Teacher views applicant list
4. Teacher adds meeting link
   └──> 🔔 Triggers notifications & emails to ALL applicants
5. Teacher exports applicants to Excel
```

---

## 🔔 Notification System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     NOTIFICATION SYSTEM                          │
└─────────────────────────────────────────────────────────────────┘

Event Occurs                    Notification Channels
────────────                    ─────────────────────

┌──────────────────┐
│ Meeting Link     │──────┬────> 📧 Email Notification
│ Added to Kuppi   │      │      (HTML template with meeting link)
└──────────────────┘      │
                          ├────> 💾 In-App Notification
                          │      (Notification model)
                          │
                          └────> 🔴 Real-time Push
                                 (Socket.io event)

┌──────────────────┐
│ Comment on Note  │──────┬────> 📧 Email to Note Owner
└──────────────────┘      │
                          ├────> 💾 In-App Notification
                          │
                          └────> 🔴 Real-time Push

┌──────────────────┐
│ React to Note    │──────┬────> 💾 In-App Notification
└──────────────────┘      │
                          └────> 🔴 Real-time Push

┌──────────────────┐
│ Apply to Kuppi   │──────────> 🔴 Real-time Push to Owner
└──────────────────┘

Email Service (Nodemailer):
├─ SMTP Configuration
├─ HTML Templates
├─ Async sending (non-blocking)
└─ Error logging

Socket.io:
├─ Personal rooms (user-specific)
├─ Group rooms (chat)
├─ Event broadcasting
└─ Real-time delivery
```

---

## 🔄 Request Flow Example

### Example: Creating a Note

```
1. Client Request
   POST /api/notes
   Headers: { Authorization: "Bearer <token>" }
   Body: { title, description, tags }
   
   ↓

2. Server Receives Request
   → Express routes to /api/notes
   → Matches POST /api/notes route
   
   ↓

3. Middleware Chain
   → protect middleware
      • Extract token from header
      • Verify JWT signature
      • Decode userId from token
      • Load user from MongoDB
      • Attach to req.user
      • Call next()
   
   ↓

4. Controller Execution
   → notesController.createNote()
      • Access req.user._id
      • Validate input
      • Create note in MongoDB
      • Populate user info
      • Emit Socket.io event
      • Return response
   
   ↓

5. Response to Client
   {
     "success": true,
     "message": "Note created successfully",
     "data": { note object }
   }
   
   ↓

6. Real-time Update
   → Socket.io emits "new-note" event
   → All connected clients receive update
   → Frontend updates UI in real-time
```

---

## 🗄️ Database Schema Relationships

```
User (Central Entity)
├── Notes (1:Many)
│   ├── Reactions (1:Many)
│   └── Comments (1:Many)
├── KuppiPosts (1:Many as owner)
│   └── KuppiApplicants (1:Many)
├── Notifications (1:Many)
├── Groups (Many:Many via members)
├── Messages (1:Many as sender)
└── Files (1:Many as uploader)

Indexes:
• User: email (unique), studentId (unique)
• Note: userId, createdAt, text search (title, description, tags)
• Reaction: userId+noteId (unique composite)
• Comment: noteId+createdAt
• KuppiPost: ownerId, eventDate, createdAt
• KuppiApplicant: postId+applicantId (unique composite)
• Notification: userId+createdAt, isRead
```

---

## 🎯 Module Responsibilities

### Authentication Module (Shared by All)
**Owner:** All team members
**Status:** ✅ Complete

**Responsibilities:**
- User registration & login
- JWT token management
- Password hashing
- Role management
- Profile updates

**APIs:** 6 endpoints

---

### Notes & Kuppi Module (Member 3)
**Owner:** Member 3
**Status:** ✅ Complete

**Responsibilities:**
- Notes CRUD operations
- Search & filtering
- Like/dislike reactions
- Comments system
- Kuppi post management
- Application handling
- Email notifications
- Excel export

**APIs:** 12 endpoints

---

### File Sharing Module (Member 2)
**Owner:** Member 2
**Status:** ✅ Complete

**Responsibilities:**
- File upload/download
- File metadata management
- Group file associations
- Storage handling

**APIs:** Multiple endpoints

---

### Groups & Chat Module (Member 4)
**Owner:** Member 4
**Status:** ✅ Complete

**Responsibilities:**
- Group creation & management
- Message sending/receiving
- Real-time chat via Socket.io
- Typing indicators

**APIs:** Multiple endpoints

---

### Timetable & Calendar Module (Member 1)
**Owner:** Member 1
**Status:** 🔄 Pending

**Suggested Structure:**
```javascript
// Models
├── Event.js
├── Timetable.js
└── Assignment.js

// Controllers
├── timetableController.js
└── calendarController.js

// Routes
├── timetableRoutes.js
└── calendarRoutes.js
```

**Suggested APIs:**
- POST /api/timetable - Create timetable entry
- GET /api/timetable - Get user's timetable
- POST /api/events - Create event
- GET /api/events - Get events
- POST /api/assignments - Create assignment
- GET /api/assignments - Get assignments

**Integration Points:**
- Use `protect` middleware for all routes
- Associate events with `req.user._id`
- Integrate with Google Calendar API (OAuth tokens in User model)
- Send notifications for upcoming events

---

## 🔌 Integration Points

### Socket.io Events

```javascript
// Server → Client Events
"new-note"              // New note created
"new-comment"           // New comment added
"notification"          // User-specific notification
"new-kuppi"             // New kuppi post created
"new-kuppi-applicant"   // New application to your kuppi
"new-message"           // New chat message
"user-typing"           // User is typing
"user-joined"           // User joined group
"user-left"             // User left group

// Client → Server Events
"join-room"             // Join personal notification room
"join-group"            // Join group chat
"leave-group"           // Leave group chat
"send-message"          // Send chat message
"typing"                // User typing indicator
```

### Email Notifications

**Triggers:**
1. Meeting link added to kuppi → Email all applicants
2. Comment on note → Email note owner

**Template:** HTML with styled layout

**Service:** Nodemailer with SMTP

---

## 🛡️ Security Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Layer 1: Transport Security                                 │
│  └─ CORS configuration                                       │
│  └─ HTTPS (in production)                                    │
│                                                               │
│  Layer 2: Authentication                                     │
│  └─ JWT token verification                                   │
│  └─ Token expiration (15 min access, 7 day refresh)         │
│  └─ Token storage in database                                │
│                                                               │
│  Layer 3: Authorization                                      │
│  └─ Role-based access control                                │
│  └─ Owner-only operations                                    │
│  └─ Resource-level permissions                               │
│                                                               │
│  Layer 4: Data Protection                                    │
│  └─ Password hashing (bcrypt, 10 rounds)                     │
│  └─ Sensitive field exclusion (password, tokens)             │
│  └─ Input validation & sanitization                          │
│                                                               │
│  Layer 5: Database Security                                  │
│  └─ Unique constraints                                       │
│  └─ Mongoose schema validation                               │
│  └─ MongoDB injection prevention                             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow: Complete Use Case

### Use Case: Student Applies to Kuppi and Receives Notification

```
1. TEACHER CREATES KUPPI
   └─> POST /api/kuppi
       • Teacher authenticated (protect middleware)
       • KuppiPost created (status: "pending", no meeting link)
       • Socket.io: emit "new-kuppi" to all clients
       • Response: Kuppi post created

2. STUDENT APPLIES
   └─> POST /api/kuppi/apply
       • Student authenticated (protect middleware)
       • Check: Can't apply to own kuppi
       • Check: Can't apply twice
       • KuppiApplicant created
       • KuppiPost.applicantsCount incremented
       • Socket.io: emit "new-kuppi-applicant" to teacher
       • Response: Application submitted

3. TEACHER VIEWS APPLICANTS
   └─> GET /api/kuppi/applicants/:postId
       • Teacher authenticated (protect middleware)
       • Check: Only owner can view
       • Fetch all applicants with user details
       • Response: List of applicants

4. TEACHER ADDS MEETING LINK
   └─> PUT /api/kuppi/:postId
       • Teacher authenticated (protect middleware)
       • Check: Only owner can update
       • Update kuppi with meeting link
       • Status changed to "scheduled"
       • 🔔 TRIGGER NOTIFICATIONS:
           ├─> For each applicant:
           │   ├─> Create Notification record
           │   ├─> Send email with meeting details
           │   └─> Mark notificationSent = true
           └─> Socket.io: emit to all applicants
       • Response: Kuppi updated

5. STUDENT RECEIVES NOTIFICATION
   • Email arrives with HTML template
   • In-app notification appears
   • Socket.io real-time update
   • Student clicks meeting link

6. TEACHER EXPORTS APPLICANTS
   └─> GET /api/kuppi/export/:postId
       • Teacher authenticated (protect middleware)
       • Check: Only owner can export
       • Generate Excel workbook
       • Style headers and cells
       • Response: Excel file download
       • Filename: Kuppi_Title_timestamp.xlsx
```

---

## 🧩 Module Integration Guide

### How Modules Work Together

```
┌─────────────────────────────────────────────────────────────────┐
│                    SHARED AUTHENTICATION                         │
│  All modules use the same User model and auth middleware        │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Timetable   │    │ Notes/Kuppi  │    │ File Sharing │
│  (Member 1)  │    │  (Member 3)  │    │  (Member 2)  │
└──────────────┘    └──────────────┘    └──────────────┘
                            │
                            ▼
                  ┌──────────────┐
                  │ Chat System  │
                  │  (Member 4)  │
                  └──────────────┘

All modules:
• Import { protect } from "../middlewares/auth.js"
• Access req.user for current user
• Use consistent response format
• Share Socket.io instance
• Share MongoDB connection
```

---

## 📈 Scalability Considerations

### Current Implementation
- Optimized MongoDB queries with indexes
- Pagination on all list endpoints
- Selective field population
- Async operations

### Future Enhancements
- Redis caching for frequently accessed data
- Database query optimization
- File storage on cloud (AWS S3, Azure Blob)
- Rate limiting per user
- API versioning (/api/v1/...)
- Microservices architecture (if needed)

---

## 🔍 Monitoring & Logging

### Current Logging
```javascript
// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Error logging
console.error("Error:", error);
```

### Production Recommendations
- Add Winston or Pino for structured logging
- Set up error tracking (Sentry)
- Monitor API response times
- Track user activity
- Database query performance monitoring

---

## 🎓 Development Workflow

```
1. Plan Feature
   └─> Define database models
   └─> Design API endpoints
   └─> Plan authorization requirements

2. Implement
   └─> Create model (src/models/)
   └─> Create controller (src/controllers/)
   └─> Create routes (src/routes/)
   └─> Add protect middleware
   └─> Register in server.js

3. Test
   └─> Test without token (should fail)
   └─> Test with token (should work)
   └─> Test authorization
   └─> Test edge cases

4. Document
   └─> Add to API documentation
   └─> Update README
   └─> Add examples

5. Integrate
   └─> Connect frontend
   └─> Test end-to-end
   └─> Deploy
```

---

## 🎨 Code Quality Standards

### Controller Template
```javascript
export const yourController = async (req, res) => {
  try {
    // 1. Get user info
    const userId = req.user._id;
    
    // 2. Validate input
    if (!requiredField) {
      return res.status(400).json({
        success: false,
        message: "Validation error"
      });
    }
    
    // 3. Check authorization (if needed)
    const resource = await Model.findById(id);
    if (resource.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }
    
    // 4. Execute business logic
    const result = await Model.create({ userId, ...data });
    
    // 5. Real-time updates (if needed)
    const io = req.app.get("io");
    io.emit("event-name", result);
    
    // 6. Return success response
    res.status(201).json({
      success: true,
      message: "Success message",
      data: result
    });
  } catch (error) {
    // 7. Error handling
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed"
    });
  }
};
```

---

## 🏆 Best Practices Implemented

✅ **RESTful API design**
✅ **Consistent response format**
✅ **Proper error handling**
✅ **Input validation**
✅ **Authorization checks**
✅ **Database indexes for performance**
✅ **Pagination for large datasets**
✅ **Real-time updates**
✅ **Email notifications**
✅ **Comprehensive documentation**
✅ **Modular architecture**
✅ **Security best practices**

---

## 📞 Quick Links

- **Main README:** `README.md`
- **For Team Members:** `TEAM_QUICK_REFERENCE.md`
- **Auth Guide:** `AUTH_SYSTEM.md`
- **Testing:** `TESTING_GUIDE.md`
- **API Docs:** `NOTES_KUPPI_API.md`
- **Postman Collection:** `POSTMAN_COLLECTION.json`

---

**System Status: ✅ Production Ready**

*Last Updated: February 22, 2026*
