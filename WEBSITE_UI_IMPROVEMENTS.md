# NewtonBotics Website UI Improvements

## Handoff Audit

The worktree was already in progress on `feature/website-ui-improvements`. The files listed below were present as modified or untracked at takeover and are documented as inherited work. Git had no commit metadata identifying whether each individual change came from Antigravity or Codex, so attribution is based on the handoff brief rather than independently verifiable history. No changes were made to `main`.

### Branch Integration

- Actual local branches: `feature/website-ui-improvements`, `feature/inventory-redesign`, `feature/inventory-ui-redesign`, and `main`. No remote feature refs were present.
- All four refs pointed to `72ac4140c343ec9e5a691d04e8b453338b03b96c`; both inventory branch comparisons had empty committed diffs against the website branch.
- Created `feature/complete-website-redesign` from `feature/website-ui-improvements`, then ran `git merge --no-ff feature/inventory-redesign`. Git reported `Already up to date`; there were no merge conflicts or unique inventory commits to apply.
- Before switching, saved the uncommitted tracked and untracked work in `stash@{0}` (`Preserve website UI, demo, and component request work`), then applied it onto the integration branch. The stash remains as a backup.
- `main` remains at its original `72ac414` commit. No commit, push, rebase, or PR was created.

### Work Attributed To Antigravity

The handoff identifies this pre-existing work as Antigravity's. Because these changes were uncommitted at takeover and Git does not identify their author, this attribution follows the handoff brief.

- Inventory was split into distinct General Lab and project inventory interfaces, with responsive catalogue, dialogs, status/category filtering, and independent project workspaces.
- `NEXT_PUBLIC_DEMO_MODE` was added as an explicit opt-in. Sample General Lab equipment, categories, projects, and project-owned components were added. Demo CRUD uses local state and `sessionStorage`; production paths continue using the existing inventory API and role permissions.
- Project inventory is read-only in production because no project-owned stock API exists. The UI explicitly distinguishes independent project stock from General Lab equipment and project-linked checkouts.
- Project details gained a **View Project Components** link to `/Inventory/projects/[projectId]`.
- The Projects and Events listings, shared navigation, and global styles received spacing, card, motion, and focus-state improvements.
- Project inventory read helpers and the `.env.example` demo-mode instructions were added.

### Follow-up Work In This Handoff

- Added category and availability filtering to the demo project-component catalogue. Corrected its notice to explain that local changes use browser-tab session storage.
- Applied the existing shared page-eyebrow and card treatments to Gallery and Team, with responsive heading spacing.
- Clamped the custom cursor to the viewport to prevent it from contributing horizontal overflow at screen edges.
- Verified the project-component demo flow by adding, editing, and deleting temporary test records; the test records were removed afterward.
- Added the component-request route, prominent Inventory CTA, fail-closed leader/member project filter, responsive form, and request history.
- Added realistic demo request history and local Pending submission/status simulation without changing inventory records. Live request submission and history remain unavailable because no component-request API exists.
- Fixed the Inventory hero and action controls wrapping at mobile widths.
- Harmonized News listing/detail, Resources, About, Profile, My Activity, and standalone sign-in/sign-up/OTP screens with the shared red/dark page, card, and spacing styles.
- Added accessible names to News/Resources filters and Escape/ARIA dialog behavior to the Resources viewer.
- Adjusted the About heading for narrow screens and repositioned the custom cursor on viewport resize.

## Files

### Inherited At Takeover

- `.env.example`
- `src/app/Events/page.jsx`
- `src/app/Inventory/[id]/page.jsx`
- `src/app/Inventory/page.jsx`
- `src/app/Inventory/projects/[projectId]/page.jsx`
- `src/app/Projects/[id]/page.jsx`
- `src/app/Projects/page.jsx`
- `src/app/components/navbar.jsx`
- `src/app/globals.css`
- `src/components/inventory/GeneralLabInventory.jsx`
- `src/components/inventory/InventoryCatalogue.jsx`
- `src/components/inventory/InventoryDialog.jsx`
- `src/components/inventory/InventoryNotice.jsx`
- `src/components/inventory/InventoryWorkspace.jsx`
- `src/components/inventory/ProjectInventories.jsx`
- `src/components/inventory/ProjectInventoryDetail.jsx`
- `src/components/inventory/inventory.module.css`
- `src/lib/demoData.js`
- `src/lib/demoMode.js`
- `src/lib/demoStore.js`
- `src/lib/inventory.js`
- `src/lib/inventoryProjects.js`

### Changed During Follow-up

- `src/app/Gallery/GalleryClient.jsx`
- `src/app/ourTeam/TeamPageClient.jsx`
- `src/app/News/page.jsx`
- `src/app/News/[id]/page.jsx`
- `src/app/Resources/page.jsx`
- `src/app/ProfileCompletion/page.jsx`
- `src/app/aboutus/page.jsx`
- `src/app/my-activity/page.jsx`
- `src/app/auth/components/AuthPageShell.jsx`
- `src/app/auth/signin/page.jsx`
- `src/app/auth/signup/page.jsx`
- `src/app/auth/reset-otp/page.jsx`
- `src/app/auth/reset/ResetPasswordClient.jsx`
- `src/app/auth/reset/page.jsx`
- `src/app/auth/verify-otp/page.jsx`
- `src/app/components/CustomCursor.jsx`
- `src/components/inventory/ProjectInventoryDetail.jsx`
- `src/app/Inventory/requests/page.jsx`
- `src/components/inventory/ComponentRequests.jsx`
- `src/components/inventory/InventoryWorkspace.jsx`
- `src/components/inventory/inventory.module.css`
- `src/lib/demoData.js`
- `src/lib/demoStore.js`
- `src/lib/projectMembership.js`
- `WEBSITE_UI_IMPROVEMENTS.md`

## Demo Mode

Demo mode is disabled unless `NEXT_PUBLIC_DEMO_MODE` is exactly `true`. To run locally:

```sh
NEXT_PUBLIC_DEMO_MODE=true npm run dev
```

Restart the server after changing the environment variable. The app marks demo mode in the inventory UI. General Lab and project inventories use sample records, search, category/availability filters, and local add/edit/delete operations. Changes are stored in the current browser tab's `sessionStorage`; they do not call production mutation APIs and are cleared when the tab's session ends. Checkout and return remain disabled for sample records. With the variable unset or set to any value other than `true`, the existing production API and role checks are used.

## Backend Limitations

The available API supports reading the project directory and General Lab inventory, plus existing authenticated General Lab operations. It does not expose independent project-owned inventory or project management endpoints. Consequently, production project workspaces can show project directory information but cannot load, add, edit, or delete project-owned stock. The UI intentionally does not invent endpoints or represent lab stock as project-owned stock.

## Verification

- `npm run lint`: passed with no ESLint warnings or errors. Next.js reports that `next lint` is deprecated, but the configured command still runs.
- `npm run build`: completed successfully and generated all routes. Static generation logged connection-refused errors for public team/contact data because the configured backend was unavailable; these did not fail the build.
- `git diff --check`: passed after all follow-up changes.
- Browser smoke checks at 390px and 1440px covered News, About, Auth, Projects, General Lab and Project Inventory, and component requests. No settled layout overflow remained; Resources/Profile/Activity redirected to sign-in without a session.
- Integration demo check confirmed 20 General Lab sample records, four sample projects, all three seeded request statuses, and two project-component links on project details.
- Demo browser check: project list rendered four sample projects; category filtering returned the matching component; local project-component add/edit/delete passed, and temporary test records were removed.
- Mobile route check at 390px: Gallery, Team, Events, and Projects list had no horizontal overflow; project detail settled at a 390px document width after the custom-cursor clamp. The project detail page exposed its inventory link in two locations.

The homepage already had a responsive hero and below-the-fold sections at takeover; global navigation, focus, and page-transition styling also apply there. A full page-by-page redesign was not performed. Contact, chat, research-area, event-detail, and project-request routes still warrant a broader visual review.

## Component Requests

The Inventory page links to `/Inventory/requests`. The form supports selecting a General Lab item or entering another component name, a positive whole-number quantity, a required purpose, and a required project. Production project choices are filtered against the authenticated user ID and the project API's `teamLeaderId` / `teamMembers` fields. No matching membership produces an explanatory empty state and no submit control. This frontend filter is only a user-interface constraint; it is not a security boundary.

No component-request create or history endpoint exists in the inspected frontend contracts. The existing `/project-requests` endpoint is for project proposals and is not used. Live request creation and history are disabled. The backend must provide authenticated create and requester-scoped history operations, derive requester identity and initial `pending` status server-side, validate project membership and positive integer quantity, and reject client-provided requester IDs, roles, or statuses. Approval/rejection must remain in the private backend/admin panel. Request submission must not reserve or deduct stock; fulfillment and stock changes must use a separate backend-authorized workflow. The backend must independently enforce identity, membership, permissions, and status transitions.

In demo mode, sample request history includes Pending, Approved, and Rejected records. Submission creates a local Pending record, and the demo-only status control simulates local transitions. These operations use session storage and never change inventory quantity or call a live request endpoint.

### Request Verification

- Browser form checks confirmed labels render, required fields block submission, and quantity `0` is invalid.
- Demo submission created a Pending request; simulated status changed it to Approved. The General Lab demo inventory data remained unchanged.
- The membership helper included matching leader/member projects, excluded an unrelated project, and returned no eligible projects without a matching identity.
- The request page and Inventory page fit a 390px viewport without horizontal overflow. The Request Components CTA rendered.
- With demo mode explicitly disabled, the route displayed the unavailable-backend notice and a signed-out visitor had no submit action.
- `git diff --check` passed.