# CampusFix Admin Portal — Complete Workflow & Component Guide

**Purpose:** This guide describes the Admin portal as currently implemented in the CampusFix source code. It is ready to share with ChatGPT or a developer and distinguishes the protected, database-backed Admin workspace from the development-only sample preview.

## 1. What the Admin portal is

The Admin portal is the operational and campus-wide oversight workspace. It combines:

1. the **Campus Problem Landscape** (aggregate campus-wide reporting patterns);
2. setup and editing for the five routing teams;
3. creation and maintenance of Authority staff accounts; and
4. a campus-wide report list where Admin can assign or reassign reports to a team; and
5. a separate CampusFix platform-feedback inbox.

Admin has a broader role than an Authority employee. An Authority account sees its own team's queue, while Admin can inspect campus-wide aggregate data, all reports and all Authority accounts. The landscape endpoint is protected at the server boundary and is Admin-only. The landscape uses structured locations, not latitude/longitude or a geographic map.

## 2. Routes and sign-in

- **Live Admin home:** `/admin`
- **Live Admin landscape directly:** `/admin/landscape`
- **Development-only full Admin sample preview:** `/__dev/admin-dashboard`
- Admin uses the Authority access sign-in page at `/authority/login`; after successful authentication the role check routes an Admin account to `/admin`. Admin may leave employee ID and department blank at that sign-in page.
- `/admin` and `/admin/landscape` are protected and require an authenticated `admin` role. Staff and student accounts are redirected to their respective role home pages; unauthenticated users are redirected to sign-in.
- The development preview is not a way to sign in as Admin. It is registered only when the frontend is running in development mode.

## 3. Full workflow at a glance

```text
Admin account signs in → /admin
        ↓
Live page loads teams, Authority accounts, campus-wide reports and aggregate landscape
        ↓
Prepare the five standard teams if this database needs initial setup
        ↓
Review the Campus Problem Landscape to spot volume, status, priority and location patterns
        ↓
Edit each team's description, routing words and expected hours
        ↓
Create/maintain Authority accounts and assign each one team
        ↓
Review all campus reports and assign/reassign reports to the appropriate team
        ↓
Authority team members handle the reports in their own /authority queue
```

The Admin home presents these sections in this order: **Campus Problem Landscape**, **Team routing**, **Authority accounts**, **Report oversight**, and **CampusFix platform feedback**. The top navigation jumps to each section: Campus picture, Team routing, Authority accounts, Platform feedback and Report oversight. On the live page it also links to Authority sign-in and provides Log out.

## 4. Page header and load behavior

The title (“The campus, in perspective.”) explains the oversight purpose. The **Prepare five teams** button runs the department seeding endpoint and reloads the Admin data.

On the live Admin page the client starts these independent loads together:
- Authority staff accounts;
- active teams/departments; and
- reports (the department report endpoint returns all reports to Admin).

The embedded Campus Problem Landscape loads its own Admin-only aggregate endpoint. If one of the three Admin data requests fails, successful data can still populate while an error message identifies a failed load; the page exposes a retry control. Landscape loading/errors are handled separately. Status notices report outcomes of actions.

## 5. Campus Problem Landscape (campus-wide overview)

This is the opening visualization and the Admin-only home-page centerpiece. It is a **structured campus-place directory**, not a coordinate map or heatmap. Location groups expand/collapse; selecting a place reveals report information for that place and its more specific child locations.

### Top summary metrics
- **All reports:** total persisted records.
- **New:** reports whose current status is Received.
- **In progress:** current In Progress reports.
- **Resolved:** Resolved plus Closed.
- **Waiting:** Received + Assigned + Escalated + Needs Review; this is “not yet marked in progress,” not a promise about elapsed time.
- **Resolution:** (Resolved + Closed) divided by all reports. When there are no records, it is displayed as unavailable rather than invented as 0%.

### Attention signals
- **High priority:** High + Urgent reports.
- **Linked repeats:** reports with an explicit duplicate marker/link.
- **Repeat locations:** locations containing linked repeats.
- **First response:** average time from submission until acknowledgement or the first qualifying status-history event (Assigned, In Progress, Resolved, Closed or Escalated); the sample count is shown. If there are no valid response samples, the page reports insufficient response history rather than making up a value.

### Status mix
A simple current-state comparison for New, In Progress and Resolved/Closed. The labels explicitly say each count is a current state, **not a funnel**.

### Coordinate-free location directory
- Campus locations are rendered from the shared structured place catalogue and organized into expandable groups.
- The current group can show location nodes, report counts and an activity signal. The signal is a visual emphasis derived from the recorded open count, High/Urgent counts, explicit repeat links and total count; it does not represent a geographic distance or physical heat.
- Selecting a node reveals child places where present, and opens a details panel with open/resolved counts, resolution rate, average first response, team mix across the five teams plus awaiting-a-team, status distribution, high-priority count and linked-repeat count.
- A report with no confirmed problem location appears in an unlocated bucket; the user's residence is never substituted for the problem site.
- An eight-week report-volume chart shows counts by UTC week.
- A Refresh button reloads the live aggregate. It is absent in the sample demo.

### Landscape privacy boundary
The live analytics API projects only fields needed for aggregate metrics: status, priority, department/predicted team, problem-location fields, created/acknowledged time, status timestamps, and explicit duplicate flags/links. It does **not** return student identity, report description, photos or student residence for this view. A shared place alone does not count as a recurring issue; recurrence is based on an explicit duplicate relationship.

## 6. Team routing section

There are exactly five teams:

1. Technical & Maintenance
2. Housekeeping & Hygiene
3. Mess / Food Services
4. Hostel Administration
5. Discipline, Safety & Wellbeing

For each team, the Admin can edit:
- **What this team handles** (description);
- **Routing words** (comma-separated terms used by report routing); and
- **Expected hours** (the team's service target used when a report is created).

**Save team mapping** sends the revised fields to the server. The current browser form prevents saving if routing words are blank or hours are below 1; the server validates the department update. Routing words determine future automatic routing; changing them does not rewrite the assignment/status of old reports automatically. Existing misrouted reports can be corrected in Report Oversight.

### Important: prepare teams before customising them
`Prepare five teams` seeds the canonical five records and deactivates any legacy/noncanonical department names. It also writes the canonical default description, routing words, SLA hours and sensitivity flag for those five names. **Running it after editing mappings can overwrite those custom values with defaults.** Use it for initial setup/canonicalisation, then customise routing; do not treat it as a harmless refresh after custom edits.

## 7. Authority account section

### Create Authority access
The form requests:
- full name;
- work email;
- employee ID;
- temporary password (at least 8 characters); and
- assigned team.

On live success, the server creates an active staff account and stores the team assignment. Email and employee ID must be unique; the department must be an active team. Password is stored hashed by the user model. The account holder later signs into `/authority/login` using their work email, password, employee ID and the same assigned department. Public student registration cannot create staff accounts.

For a **Hostel Administration** account only, the form also offers optional Admin-selected campus-listed hostel location scopes. When one or more locations are selected, that account becomes a location-scoped Hostel Warden/coordinator: the server limits its queue and report actions to those matching places, including reports whose operational team is Technical & Maintenance or Housekeeping & Hygiene. The report continues to show its actual assigned operational team; the coordinator is not represented as a Technical Head or Hygiene Head. Leaving locations blank retains the department-wide Hostel Administration queue. The Admin form does not require a head-of-team name for any operational team.

### Edit an existing staff account
Each listed Authority account displays name, email, employee ID, assigned team and active state. Admin can:
- edit and save the employee ID (must be unique; 2–40 valid characters on the server);
- change the assigned team (or choose “No team assigned”); and
- Deactivate / Reactivate the account.

Deactivated users cannot authenticate through the normal protected routes. Reassigning an employee changes their team-level access. The current page does not provide staff deletion, password reset, or work-email editing controls.

For an existing Hostel Administration account, expand **Hostel locations** to edit the canonical access scope and explicitly save it. A non-Hostel-Administration account cannot retain hostel scopes; changing its team clears them server-side.

## 8. Campus Reports / Report Oversight

The final section lists all reports available to Admin, with record count, status, title, student description, location, student name and registration/roll number. It provides a team selector (including **Needs review**) and an **Assign** button. This Admin list is an assignment surface; it does not render the report photos or the Authority team's full report-detail workflow.

When an Admin chooses an active team and assigns a report:
- the report's department is set to that team;
- status is set to Assigned;
- the predicted-team label is updated; and
- a new Assigned event with Admin and remarks is appended to status history.

The backend rejects an invalid/inactive team. This is the mechanism to move an incorrectly routed report or resolve an unassigned/Needs Review case into a team queue. After assignment, staff in that department can see it in their Authority queue. The Admin report selector's “Needs review” option is an unassigned selection; the current UI action requires a team choice before assigning.

This page does not offer a status editor in the Report Oversight list. Admin status control, if needed, is covered by the separate authenticated report/status endpoints, not this assignment widget.

## 9. CampusFix platform-feedback inbox

This is a separate Admin-only inbox for product feedback from the Landing page, Student portal and Authority portal. Each card shows the topic, message, source surface, sender role, timestamp, and a reply address or related report ID when the saved record provides one. The live route does not expose student report remarks or resolution ratings here.

These data types remain separate: **Authority remarks** are timestamped updates on an individual complaint and are visible to that student; **resolution feedback** is a student's one-time rating/comment after the report is resolved; **platform feedback** is a general CampusFix product comment listed for Admin review. Do not merge them.

Live data path: `GET /api/feedback` requires Admin authentication; `POST /api/feedback` accepts optional authentication and derives the sender role/identity from the verified account rather than trusting submitted role fields. The API stores the feedback separately in `PlatformFeedback`.

## 10. Live API/data path

The client uses the API prefix in `VITE_API_URL` or defaults to `/api`:

| Admin function | Request |
|---|---|
| Load Authority accounts | `GET /api/admin/authorities` |
| Create Authority account | `POST /api/admin/authorities` |
| Update employee ID/team/active state | `PATCH /api/admin/authorities/:id` |
| Load active teams | `GET /api/departments` |
| Prepare/canonicalize five teams | `POST /api/departments/seed` |
| Edit team mapping | `PUT /api/departments/:id` |
| Load campus-wide report rows | `GET /api/complaints/department` (Admin receives all rows) |
| Assign/reassign a report | `PATCH /api/complaints/:id/reassign` |
| Load aggregate location landscape | `GET /api/analytics/campus-landscape` |
| Load platform-feedback inbox | `GET /api/feedback` (Admin-only) |

Admin account/team/report routes and the landscape endpoint use authentication and Admin-role checks as appropriate. Reassignment is specifically Admin-only. The landscape API is Admin-only even if a non-Admin tries to call it outside the frontend route.

## 11. Local preview vs live Admin

- **Preview:** `/__dev/admin-dashboard`
- **Production Admin:** `/admin`
- The preview reuses the whole Admin screen but seeds fixed fictional data in the browser: five teams, four sample Authority accounts, five sample reports, three sample platform-feedback cards and illustrative landscape aggregates. One demo Hostel Administration account is scoped to Block 5.
- It is clearly marked “Admin preview · sample data · local only.” The notice says names and account details are fictional.
- Preview form submissions, team mapping edits, account creation/updates, team preparation and report assignments only update component state on the page. They are not persisted, and the temporary password is not saved. Preview code bypasses the live API data loading.
- The preview route is development-only, not a shortcut into the protected production Admin account.
- Real sign-in, MongoDB persistence, live analytics and real account/report controls require the backend, valid Admin account, configured database and seeded teams.

## 12. Known boundaries / sensible follow-up notes

- There is one shared status and department lifecycle; Authority status controls operate within server-validated transitions, while the Admin page described here focuses on routing/access/assignment.
- The landscape is aggregate-only; for report-specific student identities and detailed descriptions, use the Report Oversight list or authorized report details—not landscape.
- The Report Oversight section currently omits report images and does not provide a full expandable report detail. The Authority detail screen includes the photo gallery and “No image available” state.
- Team routing edits affect classifier configuration for newly submitted descriptions; they do not retroactively reassign existing records. Admin must use the report assignment control for those.
- The **Prepare five teams** button can reset customized team metadata to the canonical defaults as described above.
- The live dashboard does not silently replace missing database data with sample figures. Only the labelled development preview uses the fixture data.
- Location access is an optional scope on a Hostel Administration staff account, not a new role or substitute for the assigned operational team. The queue never infers a Warden's block from a student's residence.
- General product feedback, student-visible Authority remarks and post-resolution ratings are stored/displayed separately.

## 13. Source files used

- `client/src/student-portal/AdminDashboard.jsx` — full Admin workspace, location-scope controls and feedback inbox.
- `client/src/student-portal/AdminDashboardPreview.jsx` — development-only wrapper.
- `client/src/student-portal/data/demoAdminPortal.js` — fictional fixture.
- `client/src/student-portal/CampusProblemLandscape.jsx` and `CampusProblemLandscape.css` — aggregate coordinate-free view.
- `client/src/App.jsx` — protected and development-only routes.
- `client/src/student-portal/services/complaintService.js` — API request methods.
- `server/routes/admin.js` — Authority account administration, canonical location-scope persistence and summary endpoint.
- `server/routes/feedback.js` and `server/models/PlatformFeedback.js` — separate platform-feedback storage and Admin inbox.
- `server/core/location/locationScopes.js` — canonical Hostel Warden queue/action authorization.
- `server/routes/departments.js` and `server/config/departments.js` — team seed and mapping updates.
- `server/routes/complaints.js` — Admin all-report access and assignment.
- `server/routes/analytics.js` and `server/core/analytics/campusLandscape.js` — protected aggregate and metric formulas.
- `server/core/auth/middleware.js` — authentication and role enforcement.

---

# Copyable prompt for ChatGPT

I am building CampusFix, a VIT Bhopal-focused campus grievance platform in React/Vite with a Node/Express/MongoDB backend. Treat the following as the source of truth for the current Admin portal. Please don't confuse the local sample preview with live data, and preserve the distinction between Admin and Authority roles.

The protected Admin home is `/admin`; `/admin/landscape` opens the same Admin-only Campus Problem Landscape directly. Admin authenticates through `/authority/login` and the role router sends Admin to `/admin`. Both routes require an authenticated Admin role; the landscape analytics endpoint is also Admin-only on the server.

The Admin page contains five sections in order: (1) Campus Problem Landscape, (2) Team routing, (3) Authority accounts, (4) Campus reports/Report Oversight, and (5) a separate CampusFix platform-feedback inbox. The Landscape is a coordinate-free, structured campus place directory (not a geographic map): it shows total/new/in-progress/resolved/waiting/resolution summary, high-priority and explicitly linked repeat signals, first-response average with sample count, current status mix, selectable expandable location groups/nodes, place-specific team/status/priority/response details, and an 8-week trend. It uses problem location rather than the student's residence and excludes names, report text, photos and residence from live aggregates. Repeat issues count only from explicit duplicate links.

Team routing has exactly five teams: Technical & Maintenance; Housekeeping & Hygiene; Mess / Food Services; Hostel Administration; Discipline, Safety & Wellbeing. Admin can edit each team's description, comma-separated routing words, and expected hours. Changes configure future routing; they do not automatically reclassify existing reports. The Prepare five teams button seeds/canonicalizes the five defaults and deactivates legacy teams, but it also writes default metadata and can overwrite custom keywords/descriptions/SLA values; run it before custom edits, not afterward as a casual refresh.

Authority Accounts lets Admin create staff accounts with name, work email, employee ID, temporary password and team. Admin can edit employee IDs, change team assignment or set no team, and deactivate/reactivate accounts. For Hostel Administration only, Admin may attach one or more canonical hostel-location IDs to scope a Warden/coordinator to reports from those places across operational teams. The actual assigned team stays visible/responsible; no Technical Head or Hygiene Head personal information is required. Leaving the scope blank preserves the department queue. Authority identities are Admin-created, not publicly self-registered. There is no delete/password-reset/work-email-edit control on this page.

Report Oversight displays all report rows to Admin with status, title, student description, location and student identity. It provides team reassignment; assigning sets the report to Assigned, updates its team/predicted-team label and appends a status-history event. It does not display report photos or expose a full detail view in that list. Needs Review/unassigned reports should be assigned to an active team here. Admin's report list is separate from the Campus Problem Landscape's privacy-safe aggregate.

The Platform Feedback inbox is different from a complaint remark and a resolution rating. It shows product comments from the landing page, student portal or Authority portal, with topic, source, sender role, time, and available contact/related-report information. The live inbox is Admin-only. Feedback submissions derive account identity server-side when the sender is signed in. The local preview contains clearly fictional sample cards from all three surfaces.

Development-only preview is `/__dev/admin-dashboard`. It reuses the entire Admin layout with five fictional teams, four sample Authority accounts (including a Block 5-scoped demo account), five fictional reports, sample platform feedback and illustrative landscape data. Its actions are browser-page-local only; no sign-in, API request or database write occurs. It is not the protected live Admin account. Live persistence requires a valid Admin account, API and configured MongoDB.

Please [insert the specific question or requested UI change]. Ground recommendations in these facts, identify whether each suggestion belongs to live Admin or the development preview, and call out risks to Admin-only privacy, team routing, and existing persistence.
