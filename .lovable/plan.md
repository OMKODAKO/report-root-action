## Take Care — Build Plan

A community civic-tech app to report environmental and infrastructure issues with photo + location. Mobile-first, minimal green palette.

### Stack
- TanStack Start + React + Tailwind (existing template)
- Lovable Cloud (Supabase) for auth, DB, storage
- Leaflet + OpenStreetMap (free, no API key)
- Email/password auth now; first registered user auto-promoted to admin
- WebRTC for camera; file upload fallback

### Database (migrations)
- `profiles` (id → auth.users, name, email, profile_image, created_at)
- `user_roles` (id, user_id, role enum: admin/user) + `has_role()` security definer
- `reports` (id, user_id, image_url, description, category enum, latitude, longitude, status enum: open/in_progress/resolved, created_at)
- `likes` (id, user_id, report_id, unique pair)
- `saved_reports` (id, user_id, report_id, unique pair)
- Storage bucket `reports` (public read) for photos
- RLS: reports public read; insert/update by owner; admin full access via `has_role`
- Trigger on signup: create profile; if first user, insert admin role

### Routes
- `/` Home — hero "Small Actions. Visible Change.", How It Works (3 steps), stats (counts from DB), recent reports preview, CTAs
- `/map` — full-screen Leaflet map, color-coded markers by category, popup with photo/details, link to detail
- `/feed` — chronological list of report cards with like/save buttons
- `/report/new` (auth) — camera capture + upload, GPS + manual map pin, category select, description, submit
- `/report/$id` — detail page (image, description, category, status, location mini-map, author, date)
- `/dashboard` (auth) — profile, my reports, saved reports, activity
- `/donate` — form (name/email/amount) → "Thank you… under development" message, stored in `donations` table for record
- `/admin` (admin only) — reports table (search/filter/delete/status update), users list, stats
- `/login`, `/signup` — email/password
- `_authenticated` layout guard; `_authenticated/_admin` guard using `has_role`

### Components
- Logo: inline SVG — flower growing through cracked concrete, 72px, used in nav + hero
- Top nav: Home, Map, Feed, Dashboard, Donate, Sign In/Out (responsive hamburger on mobile)
- Category icons (Lucide): Trash2 (Garbage), Building2 (Damaged Building), Construction (Road), SprayCan (Graffiti), Hammer (Restoration), AlertTriangle (Hazard)
- Status badges with colors (open=orange, in_progress=blue, resolved=green)
- ReportCard, MapView, CameraCapture, LocationPicker components

### Server functions (createServerFn + requireSupabaseAuth)
- createReport, listReports, getReport, toggleLike, toggleSave, listMyReports, listSavedReports
- Admin: listAllUsers, updateReportStatus, deleteReport, getStats
- All RLS-respecting; admin ops gated by has_role check

### Design tokens (src/styles.css)
Map palette to semantic tokens in oklch:
- background #F8FAFC, card #FFFFFF, border #E5E7EB
- primary #22C55E, secondary #4ADE80
- foreground #0F172A, muted #64748B
- warning #F97316, success #16A34A, info #2563EB

### Out of scope
- Real payments (donation form is informational)
- Google sign-in (added later when you're ready)
- Push notifications, comments, sharing

### Deliverable
Full working MVP: register → capture/upload photo → pin location → submit → appears on map, feed, dashboard. Admin can moderate. First-registered user becomes admin automatically.
