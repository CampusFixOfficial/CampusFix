# CampusFix Authority Portal — Complete Workflow & Component Guide

**Purpose:** This guide explains the Authority portal as it currently exists in the CampusFix code. It is written to be shareable with ChatGPT or a developer. It distinguishes the real, database-backed Authority portal from the local sample preview.

## 1. What the Authority portal is

The Authority portal is a work queue for an approved campus employee. A standard Authority member sees reports routed to the department assigned to their account. An Admin may instead scope a Hostel Administration account to one or more canonical hostel locations; that location coordinator sees only matching hostel reports, including reports assigned to other operational teams. The assigned operational team remains responsible for the work. Authorities review what the student submitted, check the location and photos, add student-visible updates, and record progress.

It is **not** the Admin portal. An Authority member does not assign themselves to another team, manage accounts, change routing rules, or view the campus-wide problem landscape. Admin handles account provisioning, cross-campus oversight, and reassignment.

## 2. End-to-end flow

```text
Admin provisions Authority account and assigns one department
Admin may add canonical hostel-location scopes for a Hostel Warden/coordinator
                    ↓
Authority signs in with work email + password + employee ID + assigned department
                    ↓
CampusFix validates credentials against that account
                    ↓
Authority opens /authority; server returns either the team's reports or only the Warden's selected locations
                    ↓
Queue shows counts, urgency, status and location
                    ↓
Authority opens a report → reviews student description, understood details,
photos, status history and student contact details
                    ↓
Authority acknowledges → marks work in progress → marks resolved
(or escalates for extra attention)
                    ↓
Authority adds a separate student-visible remark and, when useful, prepares a safe share message
                    ↓
Server stores status/history/remarks; student can see the updates and rate a resolved report
```

Reports start from a student submission. CampusFix extracts the reported place and routes the description to one of the five configured teams. If a team is identified, the new report is created as **Assigned** (its history begins with Received, then Assigned). If no team can be assigned, it is **Needs Review**. Admin can confirm/reassign reports that need an assignment; an Authority member cannot claim or reassign them. A location-scoped Hostel Administration account is a coordinator for its selected places—not the head of every operational team whose report it can see.

## 3. Authority sign-in and account setup

### Sign-in page
- **Route:** `/authority/login`
- Fields: work email, password, employee ID, and an “Assigned department” selector.
- There are exactly five department choices:
  1. Technical & Maintenance
  2. Housekeeping & Hygiene
  3. Mess / Food Services
  4. Hostel Administration
  5. Discipline, Safety & Wellbeing
- Selecting a department is an identity check, **not** a way to change team assignment. The submitted employee ID and department must match those already stored on the account.
- The server checks the password, account-active state, employee ID and department. An inactive account cannot sign in.
- The public registration route is for students. Admin creates Authority accounts and assigns their department. Admin accounts can use the same sign-in page but may leave employee ID and department blank; successful login routes Admin to `/admin`.
- Successful staff login routes to `/authority`. A student account used here is signed out and shown a message directing them to student sign-in.

### Route protection
- `/authority` requires an authenticated account with the `staff` role.
- If a user is not signed in, the protected route sends them to `/authority/login`.
- If they are signed in under a different role, they are sent to the home page for their role.
- Server-side checks restrict ordinary staff to their assigned department. For a Hostel Administration account with one or more saved location scopes, those scopes replace the department-wide queue and grant access only to reports whose structured problem location matches the selected campus locations. An unscoped Hostel Administration account retains its department queue.

## 4. Queue screen and components

### Header
- CampusFix brand mark.
- Assigned-team chip, taken from the signed-in account.
- Log out button (shown in the real portal, not the sample preview).

### Page heading and total
- “Your team’s report queue” explains the page purpose.
- Total number of reports returned for the department.

### At-a-glance summary
- **New:** reports with status `Received`.
- **High priority:** reports marked `high` or `urgent`.
- **In progress:** reports with status `In Progress`.

### Queue filters
- **To do:** everything except `Resolved` and `Closed`—this may include Received, Assigned, Escalated and Needs Review.
- **In progress:** only `In Progress` reports.
- **History:** `Resolved` and `Closed` reports.
- Each tab displays a count. If a tab is empty, the page shows a short empty-state explanation.

### Report cards
Each card is a button that opens its report detail. It shows:
- current status and priority;
- age since report submission;
- title and description;
- reported problem location and assigned team;
- photo count or “No image available”;
- a visual priority glow on high/urgent cards.

## 5. Report-detail screen

Selecting a card replaces the queue with one detail view. “Back to report queue” returns to the list.

### Report summary
- Status, priority and report age.
- Report title and structured display location.

### “What the student reported”
- The student's original description. This is the source text the Authority should review, not a replacement for it.

### “What CampusFix understood”
- Assigned team (or predicted team / “Needs confirmation”).
- Priority.
- Expected response label.
- Current status.
- If the report is Needs Review or lacks a confirmed department, a note says to ask Admin to confirm assignment before updating the student.

### Photo evidence
- Displays uploaded photo thumbnails; each can be opened full-size.
- When there are no usable photo URLs, it explicitly displays **“No image available.”**
- Images are stored as URLs (the model describes Cloudinary URLs); the detail view filters out missing URLs.

### Report history
- Ordered status events, remarks and timestamps.
- If there is no history, the view says that no status changes have been recorded.

### Student-visible Authority remarks
- Authorities can add a separate update (3–1,200 characters). The form warns that the text is shown to the student and should not include internal/private administrative details.
- The backend persists each remark with a timestamp and display role (`Hostel Warden` for an assigned location coordinator, otherwise `Authority`).
- The student sees remarks chronologically in a distinct “Updates from your Authority” section. It is separate from status history and from the one-time rating/comment available after resolution.

### Next action and status controls
The page provides one primary action based on the report's current state:

| Current report state | Primary action in the UI | Result |
|---|---|---|
| Received, not acknowledged | Acknowledge report | Sets acknowledgement time and moves status to Assigned |
| Assigned, not acknowledged | Acknowledge report | Sets acknowledgement time; status remains Assigned |
| Assigned, acknowledged | Mark work in progress | Changes status to In Progress |
| Escalated | Mark work in progress | Changes status to In Progress |
| In Progress | Mark as resolved | Changes status to Resolved |
| Resolved / Closed | No status action | Report is read-only in the Authority history view |
| Needs Review | No primary status action | Ask Admin to confirm the team assignment |

The screen also offers **Escalate for extra attention** for eligible non-final statuses (not Resolved, Closed or already Escalated). The guidance text explains when to acknowledge, start work or mark resolved. It reminds the employee that a status update is visible to the student and should reflect work actually done.

The server checks that a staff member belongs to the report's assigned department and checks allowed transitions. The principal allowed transitions are:

```text
Received       → Assigned | Needs Review | Escalated
Assigned        → In Progress | Escalated | Needs Review
In Progress     → Resolved | Escalated
Escalated       → Assigned | In Progress | Needs Review
Needs Review    → Assigned | Escalated
Resolved        → Closed
Closed          → (no further transition)
```

Acknowledge is a separate endpoint: it is allowed only while status is Received or Assigned. It stamps `acknowledgedAt`; a Received report becomes Assigned, while an Assigned report stays Assigned. Each status action appends a status-history event with the actor and remarks. Resolved reports receive a `resolvedAt` timestamp.

### Student contact
- Displays student name, registration/roll number, email, and residence when available.
- Email opens the user's mail app.
- Contact details should be used only for appropriate follow-up.

### Copy and WhatsApp
- **Copy report:** copies report summary plus student contact details to the clipboard in the live portal.
- **Prepare WhatsApp message:** prepares professional, issue-specific wording with the reported location, issue, priority, assigned team and current status. It omits student name, email and registration number.
- If original photos exist and the browser supports file sharing, the first tap prepares the original image files and a second tap opens the device share sheet with the message and photos. Otherwise, the message draft and direct open/save links for each original photo are offered so the Authority can attach them manually.
- CampusFix never sends the message automatically or claims delivery. The demo does not launch WhatsApp or native sharing.

## 6. Data and service flow

The live client calls these endpoints through the complaint service (API prefix defaults to `/api`):

| Purpose | Request |
|---|---|
| Load department queue | `GET /api/complaints/department` |
| Acknowledge | `PATCH /api/complaints/:id/acknowledge` |
| Update status | `PATCH /api/complaints/:id/status` with `status` and `remarks` |
| Load one report (where allowed) | `GET /api/complaints/:id` |
| Add a student-visible remark | `POST /api/complaints/:id/remarks` with `message` |
| Submit separate CampusFix platform feedback | `POST /api/feedback` |

The queue endpoint filters ordinary staff by their stored department; a location-scoped Hostel Administration account is filtered only by its Admin-selected canonical hostel locations. The detail and action endpoints repeat the same authorization checks on the server. A location coordinator may read/update an in-scope report assigned to another operational team but cannot reassign it; the assigned team remains responsible for the repair/service. A staff member cannot access an out-of-scope report by calling an endpoint directly.

On a successful action, the client reloads the team queue and displays confirmation. On errors, it shows the server message where available and offers a retry for queue-load errors. The page also shows loading and empty states.

## 7. Local Authority preview vs live portal

- **Development preview route:** `/__dev/authority-dashboard`
- **Student-side remark preview:** `/__dev/complaint-detail` reuses the real `ComplaintDetail` page with two fictional, timestamped remarks.
- **Live route:** `/authority`
- The Authority preview renders the same queue and detail layout with `demo={true}`, five fictional team reports, and a switch to a Block 5 location-coordinator view that includes a Hygiene report and a Room 604 technical report. It is not live VIT data.
- Preview status changes, remarks, feedback and account-like controls stay in browser state only. They do not call the server, write to MongoDB, copy student details or open WhatsApp/native sharing. A visible warning labels the records fictional/local-only.
- The student-side detail preview uses the real `ComplaintDetail` component and fixed sample remarks. It skips live report loading and cannot save a rating or write to the database.
- The `/__dev/...` routes are registered only in development builds; they are not the production Authority route.
- The live portal requires a working backend and MongoDB-backed accounts/reports. Without those configured, use the preview to inspect the layout, not to validate real sign-in or persistence.

## 8. Important boundaries and implementation notes

- Standard Authority scope is **one assigned team**. A Hostel Administration account with explicit Admin-assigned location IDs is restricted to matching problem locations instead; the assigned operational team remains shown and responsible. Campus-wide analytics and the Campus Problem Landscape belong to Admin, not Authority.
- The department selector verifies the employee's assigned team; it does not alter the account's team.
- A report with Needs Review should be handled through Admin assignment, not by an Authority member attempting to claim it.
- Resolution is a claim that the work is done. The student can provide feedback (1–5 rating and optional comment) after status becomes Resolved; the server accepts that feedback only from the report's owner and only once.
- The backend's state-transition rules are stricter than merely changing a label in the UI. Admin has broader status-update authority than staff.
- **Operational limitation:** the queue currently assigns reports to a department, not to a particular employee (`assignedTo` exists on the model but the Authority queue is department-filtered). All Authority members of that team can see the team's reports.
- Student-visible remarks and platform feedback are distinct data: remarks belong to one report, resolution ratings belong to the post-resolution complaint feedback field, and general product feedback is stored in its own Admin-only inbox.

## 9. Source files used

- `client/src/student-portal/AuthorityLogin.jsx` — sign-in form and role routing.
- `client/src/student-portal/AuthorityDashboard.jsx` — queue, report detail, preview data and actions.
- `client/src/student-portal/AuthorityDashboardPreview.jsx` — local preview wrapper.
- `client/src/student-portal/ComplaintDetail.jsx` and `ComplaintDetailPreview.jsx` — student update timeline and sample-only detail wrapper.
- `client/src/student-portal/utils/authorityShare.js` — privacy-conscious message formatter.
- `server/core/location/locationScopes.js` — canonical Warden location authorization.
- `server/routes/feedback.js` and `server/models/PlatformFeedback.js` — separate product-feedback path.
- `client/src/App.jsx` — role-protected and development-only route definitions.
- `client/src/student-portal/services/complaintService.js` — client requests.
- `server/routes/auth.js` and `server/core/auth/authorityCredentials.js` — authentication checks.
- `server/routes/complaints.js` and `server/core/auth/middleware.js` — queue, permissions and status transitions.
- `server/routes/admin.js` — Admin provisioning and team assignment of Authority accounts.
- `server/config/departments.js` — the five configured teams.
- `server/models/Complaint.js` and `server/models/User.js` — persisted fields.

---

# Copyable prompt for ChatGPT

I am building CampusFix, a VIT Bhopal-focused campus grievance platform in React/Vite with a Node/Express/MongoDB backend. Please use the following description as the current source of truth for the Authority portal. Do not assume the local preview is production data, and do not redesign Admin functionality as part of the Authority page.

The Authority portal is for an approved staff member and is separate from Admin. Admin creates staff accounts and assigns exactly one department. For a Hostel Administration account, Admin may additionally assign one or more canonical hostel-location scopes for a Hostel Warden/coordinator. Staff sign in at `/authority/login` using work email, password, employee ID, and a department selected from: Technical & Maintenance; Housekeeping & Hygiene; Mess / Food Services; Hostel Administration; Discipline, Safety & Wellbeing. The submitted employee ID and department must match the values on the account; the selector is verification, not team switching. Student public registration cannot create staff accounts. Successful staff login opens the protected `/authority` route.

The server normally returns reports for the signed-in staff member's department. An Admin may give a Hostel Administration account canonical location scopes; then the server returns only matching hostel reports across operational teams, and the assigned operational team remains responsible. The queue has a total count; summary metrics for New/Received, High-or-Urgent priority, and In Progress; and tabs: To do (all except Resolved/Closed), In progress (only In Progress), History (Resolved/Closed). Cards show status, priority, age, title, description, location, team and photo availability. Selecting a card opens details with the student's original words, understood team/priority/expected response/current status, photo evidence (or “No image available”), status history, student contact, and a contextual next action.

The action lifecycle is: acknowledge Received/Assigned (Received becomes Assigned, Assigned stays Assigned); start work from Assigned or Escalated (In Progress); mark resolved from In Progress; escalate eligible non-final reports. Needs Review or unassigned cases should be referred to Admin for assignment. Every live status change is checked server-side against the Authority's team or assigned hostel scope and permitted transitions, recorded in status history, and visible to the student. An Authority can also save a separate timestamped remark that the student sees in chronological order. WhatsApp messages omit student identity and never send automatically; original photos are attached through the native share sheet when supported, otherwise open/save links are provided for manual attachment. A Resolved report can receive one student rating/comment. General CampusFix feedback is stored separately for Admin review.

There is a development-only preview at `/__dev/authority-dashboard` with fictional reports, a standard Housekeeping & Hygiene queue, and a Block 5 Hostel Warden view that includes in-scope reports assigned to different operational teams. The preview interactions are local-only: no live API or database writes, no real clipboard copy, and no WhatsApp launch. A separate `/__dev/complaint-detail` preview uses the real student detail component with fixed sample remarks. Previews are visibly labeled; the actual team queue requires configured backend/database.

Known boundaries: (1) assignment is department-level, not to an individual employee, despite an `assignedTo` model field; (2) a location-scoped Hostel Administration account is a coordinator and does not become the operational repair team; (3) the Campus Problem Landscape is Admin-only; (4) live sign-in, persistence and external image-sharing behavior require configured backend/database and a supported browser. Please [state the specific analysis/design/code request here]. Keep student-facing copy plain and avoid technical jargon in student UI.
