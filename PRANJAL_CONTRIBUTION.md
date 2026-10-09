# Pranjal Singh — CampusFix Contribution Report

## Contribution summary

This branch contains the working CampusFix source snapshot prepared for project review. The implementation and project work represented here cover the product experience, frontend, backend API, MongoDB persistence, authentication, role-based workflows, location-aware routing, reporting, notifications, media handling, testing, and deployment preparation.

This report describes the work represented by this snapshot without making a claim that no other person contributed to the broader project.

## Product implemented

CampusFix is a VIT Bhopal student grievance platform. A student can describe a campus problem, attach supporting photos, and submit a report. The application structures the report location, determines priority and expected response time, routes the issue to an appropriate campus team, and keeps progress visible to the student.

The implemented product includes:

- Student registration and sign-in using VIT Bhopal account and registration-number rules.
- Student dashboard and My Reports views.
- New complaint/report flow with structured problem details.
- Natural-language campus-location parsing.
- Five configurable operational teams:
  - Technical & Maintenance
  - Housekeeping & Hygiene
  - Mess / Food Services
  - Hostel Administration
  - Discipline, Safety & Wellbeing
- Priority and expected-response handling.
- Report status lifecycle including Received, Assigned, In Progress, Escalated, Needs Review, Resolved, and Closed.
- Student-visible status history and Authority remarks.
- Resolution feedback with rating and comment.
- Report search, filtering, sorting, and detail views.
- Photo compression and supported image storage/share behavior.
- Professional WhatsApp draft generation that avoids exposing student identity details in the message.
- Platform feedback collection from the landing page, student portal, and Authority portal.

## Authority and Admin workflows

The project includes separate protected workflows for students, Authority staff, and Admin users.

### Authority portal

- Admin-created Authority accounts.
- Work email, password, employee ID, active-state, and assigned-team validation.
- Department-matching checks at sign-in.
- Team-specific queues.
- Report detail with original description, structured location, priority, photos, history, and student contact information.
- Acknowledge, start work, resolve, and escalate actions.
- Student-visible Authority updates.
- Server-side authorization checks repeated on protected endpoints.
- Hostel Administration location-scoped coordinator access based on the reported problem location rather than the student’s residence.

### Admin portal

- Admin-only protected access.
- Preparation and management of the five canonical teams.
- Team descriptions, routing terms, and expected service hours.
- Authority account creation and maintenance.
- Employee ID, assigned-team, active-state, and hostel-location-scope management.
- Campus-wide report oversight and reassignment.
- Admin-only Campus Problem Landscape analytics.
- Platform-feedback inbox.
- Privacy-safe aggregate analytics that omit student identity, report text, photos, and residence data.

## Backend and data work

The server implementation includes:

- Express API structure.
- MongoDB/Mongoose models for users, complaints, departments, campus settings, notifications, and platform feedback.
- JWT authentication and role-based authorization.
- Password hashing.
- Server-side report ownership, team, status, and location authorization.
- Status-history persistence and response/acknowledgement timestamps.
- Location-aware access controls for Hostel Warden/coordinator workflows.
- Configurable department routing and keyword classification.
- Automatic overdue-report escalation scheduling.
- In-app notification persistence.
- Email notification integration through SMTP/Nodemailer configuration.
- Cloudinary integration for server-side image-storage workflows.
- Request rate limiting, security headers, payload limits, image validation, and environment-based configuration.
- Privacy-safe campus aggregate calculations.
- Automated backend tests covering authentication, authorization, location scope, routing, analytics privacy, and feedback behavior.

## Frontend and visual implementation

The client implementation includes:

- React and Vite application structure.
- Protected route handling by user role.
- Landing page, login, registration, student portal, Authority portal, and Admin portal.
- Responsive navigation and dashboard layouts.
- Campus Problem Landscape visualization.
- ThreeUI/Three.js interactive report paper presentation.
- Report-understanding animation and visual feedback states.
- Campus department imagery and visual assets.
- Loading, empty, error, retry, and unavailable-API states.
- Development-only sample previews clearly separated from live database-backed routes.
- Vercel SPA routing configuration for client-side routes.

## Database, media, email, and deployment work

The project is prepared to use the following deployment integrations:

- **MongoDB/MongoDB Atlas:** persistent users, reports, teams, notifications, settings, feedback, status history, and Authority data.
- **Cloudinary:** image-storage integration for report photos.
- **SMTP/Gmail App Password:** email notification integration through server environment variables.
- **Vercel:** frontend deployment configuration is included in `client/vercel.json`.
- **Node backend hosting:** the backend is packaged with a production `start` script and environment-based configuration for deployment to a Node host such as Render.

The actual production credentials and private service values are intentionally excluded from this branch. They must remain configured in the relevant hosting and service dashboards rather than being committed to GitHub.

The source code confirms the integration points and deployment preparation. The live status of a particular Render or Vercel deployment should be verified from its deployment URL and provider dashboard.

## Quality checks completed for this snapshot

- Backend test suite: **33 tests passed**.
- Frontend production build: **completed successfully with Vite**.
- Repository secret scan: no real MongoDB connection string, private key, or common API-token pattern was found in the tracked source snapshot.
- Environment values are represented through `server/.env.example`; real credentials are excluded.

## Review scope

The branch is intended to show the actual working CampusFix project files, including frontend source, backend source, shared campus data, package manifests and lockfiles, tests, documentation, deployment configuration, and this contribution report. It does not include teammate-contribution folders, local dependency directories, production secrets, database dumps, or private uploaded data.

## Relevant source areas

- `client/src/` — React application, user workflows, visual components, dashboards, and services.
- `server/` — Express API, authentication, models, routing, analytics, notifications, media, and tests.
- `shared/campus-locations.json` — shared structured campus-location catalogue.
- `client/vercel.json` — frontend SPA deployment routing.
- `server/.env.example` — safe server configuration template.
- `README.md` — local setup, routes, data behavior, and deployment integration notes.
