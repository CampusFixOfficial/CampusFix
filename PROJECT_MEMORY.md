# CampusFix — Project Memory (Source of Truth)

> **Last updated:** 2026-08-25 | **Updated by:** Bhavishya Gupta

---

## 📋 Project Idea

CampusFix is a zero-cost, web-based grievance redressal platform for a college campus. It auto-classifies complaints, routes them to the right department, tracks them to resolution, and provides analytics.

---

## 🔧 Tech Stack (Locked In)

| Layer | Tool | Status |
|-------|------|--------|
| Frontend | React.js + Vite | ✅ Set up |
| Backend / REST API | Node.js + Express.js | ✅ Set up |
| Classification microservice | Python + Flask + scikit-learn | ⬜ Pending |
| Database | MongoDB Atlas (free tier) | ⬜ Not connected yet |
| Authentication | JWT (JSON Web Tokens) | ✅ Built |
| Image/evidence storage | Cloudinary (free tier) | ⬜ Pending |
| Email notifications | Nodemailer + Gmail SMTP | ⬜ Pending |
| Frontend hosting | Vercel (free tier) | ⬜ Pending |
| Backend hosting | Render (free tier) | ⬜ Pending |
| Version control | GitHub | ✅ Repo created |

**Decision Log:**
- Auth: Using JWT (not Firebase Auth) — simpler, zero dependency
- Image storage: Cloudinary (not Firebase Storage) — simpler setup, free 25GB

---

## 🏗 Architecture

```
[Student Web App]      [Employee/Admin Web App]
        |                        |
        └──────── HTTPS/REST ────┘
                    |
                    v
         Backend API Server (Node + Express)
         Auth | Complaints CRUD | Escalation Scheduler
                    |
      ┌─────────────┼──────────────┐
      v              v              v
Classification   Database      Image Storage
Microservice   (MongoDB Atlas) (Cloudinary)
(rule + NLP)
```

---

## 👥 Ownership Areas

| Team Member | Area | Folder(s) |
|------------|------|-----------|
| **Bhavishya Gupta** (Lead) | Backend, architecture, auth, routing, integration, deployment | `server/core/`, `server/routes/auth.js`, `server/config/`, `server/server.js` |
| **Atharva Singh** | Database schemas, complaint intake, seed data | `server/models/`, `server/routes/complaints.js` |
| **Yash** | Documentation, QA, testing, demo material | `docs/` |
| **Pranjal Singh** | Student Portal frontend | `client/src/student-portal/` |
| **Prisha Sharma** | Employee/Admin Portal frontend, analytics | `client/src/admin-portal/` |

---

## 📁 Project Structure

```
CampusFix/
├── server/                         # Backend (Node + Express)
│   ├── core/                       # Bhavishya: auth, routing, escalation
│   │   ├── auth/middleware.js      #   JWT auth middleware
│   │   ├── classifier/             #   Rule-based keyword classifier
│   │   └── escalation/             #   SLA scheduler (pending)
│   ├── models/                     # Atharva: Mongoose schemas
│   │   ├── User.js
│   │   ├── Department.js
│   │   └── Complaint.js
│   ├── routes/                     # API route files
│   │   ├── auth.js                 #   Register, login, profile
│   │   ├── complaints.js           #   CRUD + status updates
│   │   ├── departments.js          #   List, seed, update
│   │   └── analytics.js            #   Placeholder
│   ├── config/
│   │   ├── env.js                  #   Environment variable loader
│   │   └── db.js                   #   MongoDB connection
│   ├── server.js                   #   Entry point
│   └── .env                        #   Secrets (NEVER commit)
├── client/                         # Frontend (React + Vite)
│   └── src/
│       ├── student-portal/         # Pranjal: Login, Register
│       ├── admin-portal/           # Prisha: (pending)
│       ├── shared/                 # Shared components
│       │   ├── components/         #   Navbar, Landing page
│       │   └── context/            #   AuthContext
│       └── App.jsx                 #   Root router
├── classifier/                     # Python Flask ML (pending)
├── docs/                           # Yash: documentation
├── PROJECT_MEMORY.md               # This file
├── .gitignore
└── README.md                       # (pending)
```

---

## ✅ Roadmap Progress

### Phase 0 — Local Tools & Accounts
- [x] 0.1 Verify/install Node.js (v24.19.0)
- [x] 0.2 Verify/install Python (v3.14.6)
- [x] 0.3 Verify/install Git (v2.55.0)
- [x] 0.4 GitHub account (CampusFixOfficial)
- [x] 0.5 GitHub repo created (CampusFixOfficial/CampusFix)
- [ ] 0.6 MongoDB Atlas account & cluster
- [ ] 0.7 MongoDB Atlas connection string
- [ ] 0.8 Auth & image storage decision → JWT + Cloudinary
- [ ] 0.9 Cloudinary account + credentials
- [ ] 0.10 Render account
- [ ] 0.11 Vercel account
- [ ] 0.12 Gmail App Password

### Phase 1 — Project Foundation ✅
- [x] 1.1 Folder structure (ownership-mapped)
- [x] 1.2 PROJECT_MEMORY.md
- [x] 1.3 .gitignore
- [ ] 1.4 Connect to GitHub & push

### Phase 2 — Backend Skeleton ✅
- [x] 2.1 Node.js project initialized
- [x] 2.2 Express + dependencies installed
- [x] 2.3 Express server with health-check route
- [x] 2.4 .env file + dotenv config
- [x] 2.5 MongoDB connection module
- [x] 2.6 Server runs locally ✅

### Phase 3 — Data Models & Auth ✅
- [x] 3.1 User schema (student/staff/admin roles)
- [x] 3.2 Department schema (keywords, SLA)
- [x] 3.3 Complaint schema (full lifecycle)
- [x] 3.4 Department seed data (6 departments)
- [x] 3.5 Signup API
- [x] 3.6 Login API with JWT
- [x] 3.7 Auth middleware
- [x] 3.8 Role-based access guards
- [ ] 3.9 Test auth end-to-end (needs DB)

### Phase 4 — Complaint Intake ✅ (API ready)
- [ ] 4.1 Image upload middleware (needs Cloudinary)
- [ ] 4.2 Client-side image compression
- [ ] 4.3 Cloudinary connection
- [x] 4.4 POST /api/complaints
- [x] 4.5 GET /api/complaints/mine
- [x] 4.6 GET /api/complaints/:id
- [ ] 4.7 Test submit flow (needs DB)

### Phase 5 — Rule-Based Classifier ✅
- [x] 5.1 Keyword dictionary (6 departments)
- [x] 5.2 Scoring function
- [x] 5.3 Wired into complaint-submit flow
- [ ] 5.4 Test suite
- [ ] 5.5 Manual testing (needs DB)

### Phase 6 — Student Portal Frontend (partial)
- [x] 6.1 React app initialized (Vite)
- [x] 6.2 CSS design system
- [x] 6.3 Layout/Navbar component
- [x] 6.4 Signup page
- [x] 6.5 Login page
- [x] 6.6 Auth context (JWT storage + role routing)
- [ ] 6.7 Complaint form page
- [ ] 6.8 My Complaints page
- [ ] 6.9 Complaint detail page
- [ ] 6.10 Student dashboard (placeholder built)
- [ ] 6.11 Full end-to-end test

### Phase 7–14 — Not started yet

---

## 🔑 Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-08-25 | JWT for auth (not Firebase) | Simpler, no extra account, fully self-contained |
| 2026-08-25 | Cloudinary for images (not Firebase Storage) | Simpler setup, 25GB free, one account |
| 2026-08-25 | Vite for React (not CRA) | Faster dev server, modern tooling |

---

## ⚠️ Known Issues / Next Steps

1. **MongoDB not connected** — need to create Atlas account and add URI to `.env`
2. **Cloudinary not connected** — need to create account and add credentials
3. **Not pushed to GitHub yet** — need to do initial commit and push
4. **Complaint form UI not built** — next priority for Pranjal's area
5. **Employee dashboard not built** — next priority for Prisha's area
