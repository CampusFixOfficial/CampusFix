# CampusFix — Project Memory (Source of Truth)

> **Last updated:** 2026-09-08 | **Updated by:** Pranjal Singh (Student Portal)

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
│       ├── student-portal/         # Pranjal: Login, Register, services, utils, components, StudentPortal.css
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
- [x] 4.2 Client-side image compression (HTML5 Canvas in client/src/student-portal/utils/imageCompressor.js)
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

### Phase 6 — Student Portal Frontend (in progress)
- [x] 6.1 React app initialized (Vite)
- [x] 6.2 CSS design system
- [x] 6.3 Layout/Navbar component
- [x] 6.4 Signup page
- [x] 6.5 Login page
- [x] 6.6 Auth context (JWT storage + role routing)
- [x] 6.7 Student Portal foundation (services/complaintService.js, utils/imageCompressor.js, StudentPortal.css, components/ directory)
- [x] 6.8 Student dashboard (live API stats, recent grievances, quick actions, empty/loading/error states)
- [x] 6.8b Visual redesign pass (AmbientBackground living environment, Manus-style dark aesthetic, 4-stage pipeline visualization, zero emojis, unified telemetry deck)
- [x] 6.8c Landing page visual implementation (Concept Reference Image: media_1788872009336.jpg — luminous silk waves, spatial neural pipeline with travelling light filaments, 4-step intake-to-resolution, and department SLA matrix)
- [ ] 6.9 Complaint form page (with client compression & anonymous toggle)
- [ ] 6.10 My Complaints page (filters & search)
- [ ] 6.11 Complaint detail page (status timeline & resolution feedback)
- [ ] 6.12 Full end-to-end test

### Phase 7–14 — Not started yet

---

## 🔑 Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-08-25 | JWT for auth (not Firebase) | Simpler, no extra account, fully self-contained |
| 2026-08-25 | Cloudinary for images (not Firebase Storage) | Simpler setup, 25GB free, one account |
| 2026-08-25 | Vite for React (not CRA) | Faster dev server, modern tooling |
| 2026-09-07 | Native HTML5 Canvas for image compression | Zero-cost, zero new dependencies; resizes & compresses JPEG/PNG/WebP to <=500KB |
| 2026-09-07 | Modular complaintService using shared Axios | Reuses AuthContext token storage and Axios config without creating duplicate auth |
| 2026-09-07 | Lightweight local SVGs & CSS for dashboard | Kept zero external runtime dependencies; used native CSS animations and inline SVGs instead of installing Motion/Lucide |
| 2026-09-07 | Manus-style atmospheric redesign & zero emojis | Eliminated all emojis across UI; implemented multi-layered AmbientBackground, 4-stage live pipeline visualizer, and telemetry deck |
| 2026-09-08 | Concept reference image landing implementation | Implemented luminous silk waves, spatial neural flow (Student Report -> AI Classification -> Department Nodes -> Issue Resolved), telemetry bar, and 4-step progressive resolution flow with zero external libraries and zero emojis |

---

## ⚠️ Known Issues / Next Steps

1. **MongoDB not connected** — need to create Atlas account and add URI to `.env`
2. **Cloudinary not connected** — need to create account and add credentials
3. **Not pushed to GitHub yet** — need to do initial commit and push
4. **Dependencies note** — Framer Motion and Lucide React are not in package.json; native CSS keyframes and SVG components used to avoid unauthorized packages
5. **Node.js/npm not in Windows PATH** — Node/npm command not directly in PowerShell PATH on dev machine
6. **Complaint form UI not built** — next priority for Pranjal's area (Step 3)
7. **Employee dashboard not built** — next priority for Prisha's area


## Step 1.1 — Student Portal local preview (2026-09-13)

- Added a development-only dashboard preview at `/__dev/student-dashboard` using clearly marked mock student data.
- Added a development-only Report Issue / AI Understanding preview at `/__dev/report-issue`.
- The preview demonstrates natural-language intake, optional local image preview, optional campus location, anonymous mode, a short processing state, and a local keyword-based interpretation.
- Preview interpretation is explicitly not the real NLP classifier and never calls the backend or stores data.
- Simplified Student Dashboard language for ordinary students while preserving the existing visual effects and real authenticated route.
- Production builds redirect development preview routes to `/` through `import.meta.env.DEV` guards.
- Real `/login`, protected `/dashboard`, JWT authentication, API contracts, server code, landing page, and MongoDB configuration were not changed for this work.
- MongoDB Atlas remains pending; real complaint submission, image storage, classifier integration, and later Student Portal features remain separate tasks.


## Current implementation handover — 2026-10-06

This section supersedes older roadmap entries above where they describe the student/Authority portals, report form, or analytics as not yet built.

- The VIT Bhopal experience now includes the premium student reporting journey, progressive Prism understanding sequence, and the bundled interactive ThreeUI paper report.
- Natural-language problem locations are parsed into structured campus fields. Reports are routed to exactly five configured CampusFix teams with inferred priority and expected-resolution guidance.
- The Campus Problem Landscape replaces the heatmap concept and is the lead view of the Admin dashboard (`/admin`), with `/admin/landscape` as an Admin-only direct route. It groups reports by structured campus locations without geographic coordinates. The Authority role has no landscape link or access; the retired Authority URL redirects to its team queue.
- The live landscape uses stored status, priority, response history and explicit duplicate links only. Multiple reports at the same place are not presented as recurring unless the records contain an explicit duplicate relationship. The development-only landscape uses fixed, labelled illustrative data and never submits to the database.
- Admin retains team routing, employee-ID/team access management and report reassignment below the landscape. Authority has a compact, filterable team queue that opens one complete report at a time, including photo evidence or “No image available”, student wording, location, status history and the appropriate next action. High/urgent queue cards receive restrained emphasis; status actions remain attached to the selected report.
- The authenticated report, user, Authority, team, status-history, acknowledgement, reassignment, analytics, and feedback paths are backed by Mongoose model reads/writes. Backend landscape coverage includes privacy and actual repeat-link metrics; rebuild/test results are recorded in the current task handover below.
- A secret-free `server/.env.example` is provided. A live MongoDB URI is not configured in this workspace, so live connection and database-backed end-to-end persistence remain to be verified after the owner supplies their own MongoDB settings.
- The FlexCarousel keeps clearly identified illustrative placeholders until the owner supplies the promised campus-problem photos; do not present the placeholders as campus photographs.


## Admin landscape and Authority experience refinement — 2026-10-06

- The Admin portal now leads with the live Campus Problem Landscape, with routing/access/report-assignment tools preserved below it; the live API and route are Admin-only. The retired `/authority/landscape` URL redirects to the Authority queue.
- The landscape starts with simple campus-wide counts and a current-state mix, then opens a location detail only after selection. Its intensity is derived from recorded open/high-priority/urgent/explicitly linked-repeat counts. It groups the VIT Bhopal location directory without geographic coordinates.
- Recurrence is deliberately conservative: counts use only `isDuplicate`/`duplicateOf` records; sharing a location is not enough to claim a recurring issue. Duplicate group IDs are used only in-memory and never returned by the aggregate endpoint.
- Authority now has a compact status-filtered queue; selecting a card opens a report detail with student wording, understood team/location/priority, attached photo or “No image available”, status history, contact details, and a single dominant next action. High/urgent cards get restrained emphasis. The demo runs the same interface with local fictional records and disabled external actions.
- Verification in this continuation: all 15 backend tests pass, including a regression that checks authentication and Admin-only access on the landscape endpoint; the production Vite build succeeds. The only build notice is the existing >500 kB ThreeUI paper chunk warning. Live MongoDB behavior still awaits the owner's own connection settings.

## Full Admin demo preview — 2026-10-06

The development-only `/__dev/admin-dashboard` route uses the actual Admin portal UI in isolated sample mode, including all five teams, fictional Authority accounts, sample reports, the Campus Problem Landscape, and page-local create/edit/assign actions. It is explicitly marked as a demo, skips auth validation, and does not call the API or persist changes. The protected `/admin` production route is unchanged.


## Cross-portal coordination and feedback — 2026-10-06

- Added one CampusFix platform-feedback surface to the public Landing page, Student portal and Authority portal. Submissions use a separate `PlatformFeedback` collection; Admin reads them in a separate, Admin-only inbox. Sender role/identity is derived from optional verified auth, and the displayed source is allow-listed. This is not a complaint remark or a post-resolution rating.
- Added persisted, timestamped Authority remarks on reports, with role labels (`Authority` / location-scoped `Hostel Warden`) and a separate chronological, student-visible updates timeline. The existing one-time post-resolution rating remains independent.
- Added canonical Admin-assigned hostel location scopes for Hostel Administration Authority accounts. A scoped account can coordinate only reports at its selected problem locations across operational teams; the report continues to identify the operational team responsible. An unscoped account keeps its normal department queue. Student residence is not used to derive the reported problem place or access scope.
- Authority sharing now prepares issue-specific, privacy-conscious WhatsApp text without student identifiers. When supported, original images can be prepared for the device share sheet; the interface offers honest manual-photo fallbacks and never sends anything automatically.
- Added the development-only `/__dev/complaint-detail` preview using the actual student detail component and fictional timestamped remarks. The complaints demo now uses only visibly synthetic student identifiers and links to this detail preview. All `/__dev/...` demonstrations remain local-only; live routes persist only when the owner configures MongoDB and the API.
- Updated `README.md`, `AUTHORITY_WORKFLOW_GUIDE.md`, and `ADMIN_WORKFLOW_GUIDE.md` to describe the current, distinct workflows and sample-data boundaries. The full source ZIP must be regenerated from this current `CampusFix/` folder before handoff.
- Verification on 2026-10-06: backend `npm test` passes **29/29**; client `npm run build` succeeds (known ThreeUI paper chunk-size advisory only); all 20 route-manifest entries parse without duplicates; Vite serves all key demo routes; a scan found no real-looking VIT email/registration identifiers in the targeted preview fixtures. Live MongoDB persistence remains unverified because no credentials/configuration are included.
