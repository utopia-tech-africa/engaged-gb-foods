# GBfoods Stock Control — Product Requirements

**Status:** Ready to build
**Source:** _GB Sorting and Segregation_ (BTL Africa, September 2026)
**Reference app:** `nestle-vendor-onboarding` — same field-plus-client shape, different domain
**Owner:** BTL Africa, for GBfoods Ghana

## 1. Summary

Build a field data platform for a nationwide stock segregation programme. Trained QC crews visit 50+ GBfoods distributor depots across Ghana’s 16 regions, separate saleable stock from suspect stock (priority SKUs: Gino and Pomo Tomato Mix), and close every depot with a signed reconciliation.

The app is the system of record for that work. Field staff capture attendance, counts, and photos on a phone, including offline. Supervisors verify the record. GBfoods sees synced progress and is the only party that can release or reject held stock.

This is the software described in the deck as **Stock Control** (slides 24–32). Training delivery, T-shirt production, transport, and the commercial quotation stay outside the product. The app records the outcomes of those activities (roster, assessment, readiness, cost-to-complete is a later report, not a pricing engine).

## 2. Problem

GBfoods needs one view of stock status at every depot: what was found, what is saleable, what is held, who has custody, and who authorised the next action. Today that would live in paper counts, WhatsApp photos, and spreadsheets. The deck’s failure modes are exactly what the product has to prevent:

- A depot closes with an unexplained quantity variance.
- Held stock returns to sale without a GBfoods decision.
- Attendance or evidence cannot be tied to a named person, depot, SKU, and batch.
- The client cannot see what has synced, what is waiting, and what is blocked.

## 3. Users and roles

Access is role-based. A person sees only the depots and actions their role allows. Client visibility is separate from field edit, supervisor verification, and administration.

| Role                  | Who                                     | What they do in the app                                                                |
| --------------------- | --------------------------------------- | -------------------------------------------------------------------------------------- |
| QC person             | One assigned to each distributor        | Check in, capture stock and photos, reconcile, request handover signature              |
| Stock handler         | Counting support, sized after the pilot | Enter counts on a visit the QC owns. Cannot classify quality or close a depot          |
| Cluster supervisor    | Up to 5 distributors in one region      | Verify attendance exceptions, evidence, and reconciliations. Escalate quality issues   |
| Regional supervisor   | 1 per region (16)                       | Regional roster, coverage, unresolved exceptions, consolidated daily return            |
| National operations   | Operations manager                      | All regions, reserve coverage, dispatch confirmation, daily client review              |
| National quality lead | BTL quality                             | Calibration, classification audit, escalate disposition to GBfoods                     |
| Platform admin        | Data and platform lead                  | Users, roles, depot master data, SKUs, evidence rules, sync health, audit trail        |
| GBfoods reviewer      | Client                                  | Read synced records. Record a quality decision with a reason. Cannot edit field counts |
| Depot representative  | Distributor staff on site               | No login in v1. Signs the handover on the QC device                                    |

Project Director is a read-only national view of the same client and operations dashboards. Do not add a separate product surface for it.

**Authority rule, non-negotiable:** no held or rejected stock becomes saleable unless an authorised GBfoods user records the disposition. QC classifies and separates. The cluster supervisor verifies the record. GBfoods decides.

## 4. Goals

1. Every depot on the approved register ends as **completed** or as an **explicit exception** with an owner and a due date.
2. Every stock movement is traceable by depot, SKU, batch, quantity, unit, condition, and custodian.
3. Every check-in has a named person, an attendance photo, a timestamp, and a recorded location (latitude, longitude, and accuracy). A missing fix is stored as unavailable and does not block the visit.
4. GBfoods can filter live progress by region, depot, date, and review status, open the evidence, and record a decision.
5. A depot with no signal can finish the day. Records sync later and show their sync time.

### Scorecard the product must be able to report

| Measure                 | Target                                               | Evidence in the app      |
| ----------------------- | ---------------------------------------------------- | ------------------------ |
| Depot coverage          | 100% completed or explicit exception                 | Depot register status    |
| Stock reconciliation    | 100% signed, no unexplained variance at close        | Reconciliation pack      |
| Daily reporting         | At least 95% of active depots reported by the cutoff | Timestamped daily return |
| Held-stock traceability | 100% with reason and custodian                       | Batch hold log           |

Productivity (units per team-hour) is measured at the pilot and then configured. Do not hard-code a recovery-rate promise.

## 5. Non-goals

Out of the product for v1:

- Facial recognition. Attendance is a photo plus staff ID, reviewed by a person.
- Geofencing. No depot radius, no inside-or-outside check, and no exception because a fix is far from the depot. The deck’s “flag check-ins outside the agreed depot radius” is not in this product.
- Continuous GPS tracking. Location is a single reading on a work event, not a live trail.
- Pricing, invoicing, or the GHS field quotation. Payment terms (40% / 40% / balance) are commercial, not software.
- Disposal, laboratory testing, haulage, and primary reprocessing.
- A training-content studio. v1 stores attendance and pass/fail against a fixed checklist.
- T-shirt and ID-card production. v1 stores the roster fields that go on the card (photo, name, staff number, role).
- Depot-representative accounts and a distributor portal.

## 6. Operating model the software encodes

Three stages, with a gate between each.

**Pre.** Recce confirms GPS, access, contacts, workspace, and estimated stock. Readiness is signed. Crews are on the roster only after assessment. Routes freeze at 17:00 for the next day after depot confirmation by 15:00.

**During.** Physical zones at the depot:

| Zone                          | Meaning                                    | System rule                                       |
| ----------------------------- | ------------------------------------------ | ------------------------------------------------- |
| Unexamined                    | Awaiting inspection                        | Opening balance lives here until classified       |
| Conforming, pending release   | Apparently acceptable                      | Stays pending until GBfoods releases it           |
| Recoverable, pending approval | Intact units that need secondary repacking | Requires an approved method before it can move    |
| Held or rejected              | Suspect or quality-affected                | Secure, labelled, custodian named, awaits GBfoods |
| Released, remaining on site   | Accepted stock still at the depot          | Closing category, separate from holds             |

**Post.** Reconciliation identity is `opening + inward − outward = closing`, on one unit basis per SKU, with batch and expiry retained. Three confirmations: QC person, cluster supervisor, depot representative. National closeout is the register of those packs plus open actions GBfoods has accepted.

**Escalation, from the deck:**

| Trigger                 | Immediate response                                 | Decision owner             |
| ----------------------- | -------------------------------------------------- | -------------------------- |
| Quality or safety event | Stop the task, secure the stock                    | Quality lead, then GBfoods |
| Count mismatch          | Recount and isolate the disputed quantity          | Cluster supervisor         |
| Access or crew failure  | Switch to a confirmed nearby depot or reserve crew | National operations        |
| Excess volume or delay  | Reforecast days before expanding scope             | Operations and GBfoods     |

Critical events: escalate immediately, phone within 15 minutes where possible, written record within 1 hour.

## 7. Product surfaces

One Next.js app, three shells. Same pattern as Nestlé: a phone-first field shell and desktop review shells.

### 7.1 Field (QC, handler, and supervisors on site)

Phone, installable, works offline for the visit.

1. **Sign in.** Staff ID + PIN. Session opens on the assigned depot and role. No email required for field users.
2. **Check in.** Attendance photo (retake allowed) and a location reading (latitude, longitude, accuracy, capture time). If the device cannot get a fix, store the location as unavailable and continue. Check out uses the same capture. There is no radius check.
3. **Visit home.** Depot name, visit id, zone totals, sync state, blockers.
4. **Opening count.** SKU, batch or expiry, quantity, unit (case or loose pack). Pack factor converts to a single unit basis. Required fields block submit.
5. **Stock record.** Condition is one of the five zones. Photos required for pack, batch or expiry marking, and defect when condition is held, rejected, or recoverable. Optional wider stock photo. Each image stores depot, visit, SKU, batch, quantity, condition, and capture time.
6. **Offline draft.** Save on device. Upload progress, retry, and “submit after sync”. Incomplete records return to the missing field. Original photos are kept if a later edit is rejected.
7. **Reconciliation.** Computed balance, variance highlighted, signature capture for QC and depot representative. Supervisor verifies in the review shell or on the same visit if they are on site.
8. **Exception.** Short form: type, note, photos. Creates the escalation record with timestamp.

Handlers can add counts and photos on an open visit. They cannot set a quality disposition, sign the depot closed, or edit another person’s attendance.

### 7.2 Operations (BTL supervisors, quality, admin)

1. **Network.** 16 regions, distributors, depot address and an optional recce pin (latitude and longitude only, no radius), contacts, opening hours, readiness status.
2. **Recce.** Checklist (access, stock estimate, workspace, power, signal, holding zones), dated photos, gaps with owner and deadline, decision: ready or hold. A critical access or safety gap cannot be dispatched.
3. **People.** Staff profile (photo, name, staff number, role, phone, region, cluster, assigned distributor). PIN set by admin. Deactivate on exit; lost-card is a flag, not a new auth system.
4. **Roster and assessment.** Checklist result per person. Failed mandatory safety, quality, or record-keeping steps keep them off the dispatch roster.
5. **Dispatch.** Next-day route frozen per cluster. QC stays assigned to their distributor. Supervisor plans across up to five sites.
6. **Review queue.** Blurred or missing photos, count mismatches, sync older than the threshold. Location is shown on the record. It is not a review trigger.
7. **Daily return.** Regional supervisor submits coverage, stock status, variances, incidents. National view aggregates it for the 18:00 client snapshot.
8. **Audit.** Every correction stores actor, time, previous value, and reason.

### 7.3 Client (GBfoods)

Control room. Read plus disposition only.

- **Overview.** Depots complete (for example 32/50), records to review, quality holds, depots with sync delay. Last sync time on the page and on each depot.
- **Depots.** Filter by region, depot, date, review status (pending, hold, reviewed).
- **Record.** SKU, batch, quantity, condition, photos, GPS, who captured it, review history.
- **Decide.** Release, hold, reject, or approve repack. Reason required. This is the only write GBfoods has in v1.
- **Exceptions.** Variances, missing evidence, outstanding holds. Comment or request a correction. The correction is done by BTL, not by overwriting the original.
- **Export.** Depot pack and national register (CSV first, PDF pack second).

Offline records appear only after sync, with that sync time visible. Do not show device-only drafts to the client.

## 8. Key flows

### Ready to dispatch

Admin creates region → distributor → depot (address, optional recce pin, contact) → assigns cluster supervisor and QC → QC passes assessment → recce status is ready → regional supervisor signs readiness → depot can be placed on a route.

### Depot day

Check in (photo + location) → opening count → classify into zones with photos → supervisor spot-check → reconciliation → three-party confirmation → check out → sync. Each of those captures stores its own location reading. A weak or missing fix is recorded and the visit continues.

### Quality hold

QC marks held or rejected → stock is locked from any “release” transition → supervisor verifies → quality lead can escalate → GBfoods records the disposition → the movement is appended, not overwritten.

### Close

A depot is complete only when the reconciliation is signed, every held quantity has a custodian and a reason, and there is no unexplained variance. Anything left open is an exception with owner and due date, accepted by GBfoods at national review.

## 9. Data model

PostgreSQL via Prisma. Identifiers are cuid. Quantities are integers in the declared unit, plus a stored base-unit quantity using the SKU pack factor.

**Organisation.** `Region` (16 Ghana regions, code + name), `Cluster`, `Distributor`, `Depot` (address, optional recce latitude and longitude, contact, opening hours, readiness). No radius column.

**People.** `User` (staff number unique, name, phone, role, photo object key, PIN hash, active), `Assignment` (user, depot or cluster or region, effective dates).

**Catalogue.** `Sku` (name, brand, pack factor, case unit, loose unit, active). Priority seed: Gino Tomato Mix, Pomo Tomato Mix. `DefectCode` (approved guide entries).

**Field work.** `Visit` (depot, date, QC, status: scheduled, in progress, pending review, complete, exception). `Attendance` (user, visit, kind check-in or check-out, photo key, latitude, longitude, accuracy metres, captured at; null coordinates mean the fix was unavailable). `StockLot` (visit, sku, batch code, expiry, zone, quantity, unit, base quantity, custodian, notes, and the same location fields). `StockMovement` (lot, type opening / inward / outward / zone transfer / disposition, quantity, actor). `Evidence` (lot or attendance or recce, category pack / batch / defect / position / recce, object key, captured at). `Signature` (visit, role, name, image key or drawn signature, signed at).

**Control.** `Recce` (depot, checklist JSON, decision ready or hold, author). `Escalation` (visit, trigger, status, owner, due at, written record). `Disposition` (lot, decision, reason, GBfoods user, decided at). `Review` (entity, action, actor, reason, at). `DailyReturn` (region, date, submitted at, summary).

**Sync.** `SyncBatch` (device id, user, received at) on each uploaded visit mutation so the client can show last sync.

Reconciliation is derived: sum of opening + inward − outward per SKU and batch. Do not store a second editable closing figure. A variance is any remainder that is not assigned to a closing zone.

## 10. MVP cut

Ship in this order so a pilot of two depots can run before national rollout. Each slice is usable on its own.

### Slice 1 — Network and access

Monorepo, auth, roles, regions, distributors, depots, users with staff ID and PIN, assignments. Admin can sign in and see an empty but real network. Field user can sign in and land on their depot.

### Slice 2 — Attendance

Photo check-in and check-out with a stored location reading. No radius flag and no distance exception. Supervisor queue is for missing photos and later for count issues, not for where the fix landed.

### Slice 3 — Stock capture and evidence

Opening count and zone records, required photos, offline draft and sync, upload retry. Client can open a synced record but cannot decide yet.

### Slice 4 — Review, reconcile, decide

Supervisor verification, reconciliation math, signatures, GBfoods disposition, hold lock. Two pilot depots can complete a full day.

### Slice 5 — Control room and closeout

Overview counts, filters, sync-delay list, daily return, CSV export, depot complete versus exception. Recce checklist and assessment roster if the pilot needs them; otherwise they follow immediately after.

**Explicitly after the pilot:** route optimiser, PDF dossier, units-per-hour scorecard, handler-only limited role if QC is entering handler counts in the pilot, push notifications for the 15-minute escalation call.

## 11. Technical approach

Copy the Nestlé monorepo shape, not its vendor domain and not its media vendor.

| Piece       | Choice                                                                                                                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repo        | pnpm + Turborepo. `apps/web`, `apps/api`                                                                                                                                                                                              |
| Web         | Next.js App Router, TypeScript strict, Tailwind, phone-first field routes and desktop ops/client routes                                                                                                                               |
| API         | NestJS. Controllers, services, Prisma. Swagger at `/api/docs`                                                                                                                                                                         |
| Client data | Orval React Query hooks generated from the OpenAPI spec. No hand-written fetch layer                                                                                                                                                  |
| Database    | PostgreSQL                                                                                                                                                                                                                            |
| Auth        | Staff ID + PIN for field. Email + password for ops and GBfoods. Short-lived access token, rotating refresh session                                                                                                                    |
| Offline     | PWA. Queue mutations and photo blobs on device. Sync is explicit and resumable. Last sync time is server receipt time                                                                                                                 |
| Media       | Cloudflare R2. API returns a presigned PUT. Browser uploads the file. API stores the object key. Public base URL for non-sensitive evidence is acceptable; attendance photos and signatures are private and read with a presigned GET |
| Location    | One device reading (latitude, longitude, accuracy, time) on check-in, check-out, and each stock record. No radius, no distance comparison, no continuous tracking                                                                     |
| Lint        | Biome at the repo root, Husky pre-commit. Do not add ESLint or Prettier                                                                                                                                                               |
| IDs         | Human visit and record codes (the deck uses forms like `GH-014` and `GH-014-007`) generated from region code + sequence, separate from the cuid                                                                                       |

**Intentional differences from Nestlé vendor onboarding:**

- Domain is depots, SKUs, batches, and zones, not outlets and vendor onboarding.
- Sign-in for the field is staff ID + PIN, matching the deck, not phone OTP.
- Photos go to R2, not Cloudinary.
- GBfoods disposition is a first-class write path. Nestlé’s client role is mostly read.
- Location is recorded on work events and never checked against a geofence. Do not port Nestlé’s geofence validation or tracking ping stream.

Environment variables belong in the README when the app exists: `DATABASE_URL`, auth secrets, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`. Do not commit `.env` or `.env.example`.

## 12. Permissions matrix

| Action                         | QC  | Handler     | Cluster     | Regional   | Ops  | Quality         | Admin | GBfoods      |
| ------------------------------ | --- | ----------- | ----------- | ---------- | ---- | --------------- | ----- | ------------ |
| Check in at assigned depot     | Yes | Yes         | Yes         | Yes        | No   | No              | No    | No           |
| Create stock record            | Yes | Counts only | Yes         | No         | No   | No              | No    | No           |
| Set zone / condition           | Yes | No          | Yes         | No         | No   | Audit flag      | No    | No           |
| Sign reconciliation            | Yes | No          | Yes         | No         | No   | No              | No    | No           |
| Verify and correct with reason | No  | No          | Own cluster | Own region | All  | Classifications | All   | Request only |
| Quality disposition            | No  | No          | No          | No         | No   | Escalate only   | No    | Yes          |
| Master data                    | No  | No          | No          | No         | Read | Read            | Yes   | Read         |
| Client dashboard               | No  | No          | No          | Read       | Read | Read            | Read  | Yes          |

Regional and national users see rolled-up data. A QC sees only their assigned distributor’s depots.

## 13. Functional requirements

Numbered so slices can be ticketed directly.

**Identity**

- FR-1. A field user signs in with staff ID and PIN and receives only their role and assigned depots.
- FR-2. An inactive user cannot sign in. Deactivation is immediate.
- FR-3. Five failed PIN attempts lock the account until an admin or supervisor unlocks it.

**Places**

- FR-4. Admin can create the 16 regions, distributors, and depots before any field user exists.
- FR-5. Check-in, check-out, and each stock record store latitude, longitude, accuracy, and capture time when the device can provide them.
- FR-6. A missing location fix is stored as unavailable. It does not block the visit, create an exception, or require a supervisor to clear it.

**Capture**

- FR-7. A stock record requires SKU, batch code, quantity greater than zero, unit, and condition.
- FR-8. Held, rejected, and recoverable records require pack, batch, and defect photos before submit.
- FR-9. The device can save a complete record with no network and upload it later without duplicating it.
- FR-10. Failed uploads retry and show progress. The client view hides the record until the server accepts it.

**Stock integrity**

- FR-11. Closing balance is calculated. Users cannot type a closing figure that bypasses the movements.
- FR-12. A held lot cannot move to conforming or released unless a GBfoods disposition says so.
- FR-13. Disposition stores the user, decision, reason, and time, and appends a movement.
- FR-14. Reconciliation cannot be marked signed while an unexplained variance remains.

**Evidence and audit**

- FR-15. Photos and attendance images are addressable by object key and retained for the agreed retention period (default 24 months, confirm with GBfoods before go-live).
- FR-16. Edits after submit create a review entry. They do not destroy the original quantity, photo, or timestamp.
- FR-17. Every depot list and record shows the last successful sync time.

**Reporting**

- FR-18. The client overview shows depots complete, records awaiting review, open holds, and depots past the sync threshold.
- FR-19. Filters: region, depot, date, review status.
- FR-20. CSV export of the depot reconciliation and the hold log.

## 14. Pilot acceptance

The deck’s go-live gate is GBfoods accepting a tested workflow at two depots with different stock or access profiles. The build is done for pilot when:

- A QC can sign in, check in with a photo and a stored location, capture a held Gino lot with three photos and its own location, lose signal, regain it, and sync once.
- The supervisor can see a missing-photo exception and clear it with a reason. A check-in with no location fix still appears, with location marked unavailable, and needs no clearance.
- Reconciliation math matches a scripted opening, inward, outward, and zone split, including a case-to-pack conversion.
- A GBfoods user can release one lot and is blocked from releasing a second lot that has no disposition.
- The overview counts match the database for those two depots.
- An inactive QC cannot sign in, and a handler cannot set a disposition.

## 15. Open decisions

These do not block slice 1. Resolve before slice 3 is finished.

1. **Sync-delay threshold.** Proposal: 2 hours during a scheduled visit day, evaluated at 18:00 for the client snapshot.
2. **Pack factors.** Need GBfoods’ case and loose-pack conversion per SKU before reconciliation is trustworthy.
3. **Batch identity.** Free-text batch code in v1, or a list issued by GBfoods. Proposal: free text with a format hint, plus expiry date.
4. **Who may unlock a PIN.** Proposal: cluster supervisor for their QC persons, admin for everyone else.
5. **Retention and consent copy.** The deck says agree this before deployment. Default 24 months, private attendance photos, no biometric template stored. Location readings are kept with the same retention as the record they belong to.
6. **Depot register.** Real distributor names, contacts, and regional allocations are not in the deck. Seed Greater Accra as the first cluster shape (one regional supervisor, clusters of five, one QC each) and load the rest from a spreadsheet.

## 16. First build tasks

Start here, in order, without waiting on the commercial quotation:

1. Scaffold the monorepo (pnpm, Turborepo, Biome, Husky, NestJS, Next.js, Prisma, PostgreSQL, Swagger).
2. Seed Ghana’s 16 regions and the five roles needed for the pilot: QC, cluster supervisor, admin, GBfoods reviewer. Add the other roles as empty permissions, not extra screens.
3. Ship depot master data and staff ID + PIN sign-in.
4. Port the Nestlé pattern for photo check-in and the offline queue, pointed at depots and R2. Store the location reading. Leave out the geofence check.

Slices 3 and 4 are the product. Slices 1 and 2 prove the shell against a pattern this team already runs.
