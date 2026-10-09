# CampusFix

CampusFix is a VIT Bhopal student grievance platform. Students describe an issue naturally; CampusFix derives a problem location, routes the report to one of five campus teams, and keeps its progress visible. The project preserves the supplied React/Vite, Express/MongoDB, JWT, visual-effects, and ThreeUI paper foundation.

## Run locally

1. Copy `server/.env.example` to `server/.env`. Set `MONGODB_URI` to your local MongoDB or Atlas connection string and replace `JWT_SECRET` with a long random secret before deployment. `VIT_PROGRAM_CODES` is an optional comma-separated allow-list; leave it empty to accept any 2–6 letter branch/program code in the registration-number structure. Never commit `server/.env`.
2. Start the API: `cd server && npm ci && npm run dev`.
3. From a second terminal start the client: `cd client && npm ci && npm run dev`.
4. The Vite dev server proxies `/api` to `http://127.0.0.1:5000`; set `CAMPUSFIX_API_PROXY` to use another local API host. Set `VITE_API_URL` only when the API is on another origin.
5. Sign in using a VIT student account. Admin and Authority accounts are never created through public registration. An existing admin opens `/admin`, prepares the five teams, edits team keywords/timelines, then creates Authority accounts with a unique employee ID and assigned team. Existing Authority IDs can also be added or corrected there.
6. Authority team members sign in with work email, password, employee ID and their assigned department. The department selected at sign-in is checked against the admin-assigned team; it cannot change an account's access. Admins may use the Authority sign-in page with employee ID and department left blank.

For a database-free look at the visualization, open `/__dev/campus-problem-landscape` while the Vite development server is running. It uses fixed, clearly labelled example data only. The authenticated Admin dashboard at `/admin` leads with the live Campus Problem Landscape; `/admin/landscape` opens the same view directly. Authority accounts use `/authority` for their assigned report queue and do not have access to the landscape.

An Admin may scope a **Hostel Administration** Authority account to one or more canonical hostel locations. A scoped account coordinates reports from those places across operational teams, while the assigned repair/service team remains clearly responsible. Without location scopes, the account retains its department-wide queue.

MongoDB remains required for persistent accounts, reports, employee IDs, Authority actions/remarks, and platform feedback. This source package does not include a live database URI or credentials; live persistence therefore still needs to be verified after you configure your own MongoDB instance. The interface does not present a successful submission when the API is unavailable.

The persistence path is connected in the source: account and Authority creation use MongoDB models; report submission writes the report and its initial history before returning success; student and Authority queues read from those stored reports; status, acknowledgement, reassignment, student-visible Authority remarks, and resolution feedback save back to the report document. General CampusFix platform feedback uses a separate model and Admin-only inbox. The Campus Problem Landscape reads only the fields it needs from MongoDB and omits student identity, report text, photos, and residence fields. Report photos are compressed in the browser and sent with the report. Where browser support permits, report photos are passed to the device share sheet; otherwise the original-photo links remain available for manual attachment.

## Product routes

- `/`, `/login`, `/register`
- `/dashboard`, `/complaints`, `/complaints/new`, `/complaints/:id`
- `/authority/login`, `/authority`
- `/admin` (Campus Problem Landscape, followed by team, access and report controls)
- `/admin/landscape` (Admin-only direct landscape view)
- Development-only mock views: `/__dev/student-dashboard`, `/__dev/report-issue`, `/__dev/complaints`, `/__dev/complaint-detail`, `/__dev/authority-dashboard`, `/__dev/admin-dashboard`, `/__dev/campus-problem-landscape`

Development-only student, Authority and full Admin previews use clearly fictional sample records and local-only controls. `/__dev/complaint-detail` reuses the actual student detail page to show chronological sample Authority remarks without requesting a live record. The Authority preview switches between its five-team queue and a Block 5 location-coordinator queue; the assigned operational team remains responsible. The Admin preview contains a separate sample product-feedback inbox. The Campus Problem Landscape calculates clearly labelled illustrative metrics from a fixed sample set. These demos do not sign in, call the API, or write to the database.

Platform feedback from the Landing page, Student portal and Authority portal is separate from both a complaint remark and the student's rating/comment after resolution. Product feedback appears in its own Admin inbox. A Hostel Warden/coordinator scope is assigned by Admin from the canonical location catalogue; report access is based on where the problem occurred, never inferred from a student's residence.

## Data behavior

Public student accounts use a VIT Bhopal email whose local part includes the same normalized registration number. Only Hostellers see hostel-specific registration fields. Complaint location means where the problem happened; the shared `shared/campus-locations.json` catalogue feeds both natural-language location parsing and the Admin landscape. `/admin` shows real aggregate counts, priority/status distribution, location activity, team mix, resolution and response patterns without geographic coordinates. Linked repeats count only when reports have explicit stored duplicate links; multiple reports sharing a place alone are not labelled recurring. The protected view does not substitute demo figures when the API/database is unavailable. The aggregate API omits student identity, report text, photos, and residence fields.

The student report animation is a purposeful ~10-second sequence before the real bundled ThreeUI paper is revealed. The paper retains the source's Three.js physical folding/turning behavior and receives CampusFix report content at runtime.

Run backend logic checks with `cd server && npm test`; they cover the sample Block 5 location extraction and privacy-safe landscape aggregation without requiring a MongoDB connection.

## Product hardening update — 2026-10-06

- Landing page includes a dedicated Admin login entry at `/admin/login`; Admin sign-in hides Authority-only employee and department fields.
- Admin navigation links now target real sections instead of retired routes.
- Student My Reports supports search, status/priority filters, and sorting.
- Admin-managed Warden blocks and Mess locations persist through the Admin-only MongoDB location catalogue API, with browser storage retained only as a fallback.
- Overdue reports are automatically escalated every 15 minutes after database startup and recorded in status history.
- In-app notifications are stored for students when Authority remarks or report statuses change and shown on the student dashboard.
- Authentication routes have a lightweight rate limit; the API adds baseline security headers and lower JSON payload limits.
- Report image payloads are server-validated for approved image data URLs or HTTPS URLs and capped before storage.
- The 10-second student understanding animation was intentionally left unchanged, including its timing and Prism behavior. The visible caret remains disabled as previously requested.

Email delivery, Cloudinary upload processing, password reset, and refresh-token sessions remain deployment integrations that require the owner's SMTP/storage/security credentials and should be enabled before public launch.
