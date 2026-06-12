# SiteDrop — Product Requirements Document

## Overview

SiteDrop is a zero-config static site hosting tool. Users drag-and-drop a folder (or select files) and their site goes live in seconds with a shareable public URL. Every deployment is private to the account that created it.

**Live app:** https://family-trip-2026-1osp.bolt.host  
**Stack:** React 18 + Vite + TypeScript + Tailwind CSS + Supabase (Postgres + Storage + Auth)

---

## Problem

Deploying a quick static site — a prototype, a demo, a trip itinerary — requires too many steps with existing tools (Netlify, Vercel, GitHub Pages). You need a repo, a CLI, or a lengthy dashboard flow. There is no tool that is as fast as copying a file.

---

## Goals

| Goal | Success Metric |
|---|---|
| Deploy a site in under 10 seconds | Drop → live URL in < 10s on a fast connection |
| No config required | Zero files to edit before deploying |
| Secure by default | Each deployment is accessible only to the creating account |
| Works for any static site | HTML/CSS/JS/images/fonts — no framework lock-in |

---

## Users

- **Developers** sharing prototypes or demos with clients
- **Designers** publishing static HTML exports from Figma/Webflow/etc.
- **Non-technical users** hosting simple HTML pages (resumes, event pages, trip plans)

---

## Core Features

### 1. Authentication
- Google OAuth via Supabase Auth
- All deployments are scoped to the signed-in user (RLS enforced at DB + Storage layer)
- Sign-out available from the header dropdown

### 2. Deploy (Drop Zone)
- Drag-and-drop a folder or individual files onto the drop zone
- Or use "Browse Folder" / "Browse Files" buttons
- Folder traversal strips the top-level directory prefix so `index.html` lives at root
- Hidden files (dotfiles) are filtered out automatically
- Pre-deploy preview shows all files, total size, and a warning if `index.html` is missing
- Name is inferred from the dropped folder name; user can customize on redeploy

### 3. Upload Progress
- Circular progress ring showing % complete
- Per-file progress (current file name, bytes uploaded vs. total)
- Sequential file uploads to Supabase Storage under `sites/{slug}/{path}`

### 4. Deployment Success
- Green success banner with file count and total size
- Shareable public URL shown with one-click copy
- Direct "Open Site" link and "View Files" navigation

### 5. My Sites (Deployments List)
- Lists all deployments for the signed-in user, newest first
- Live search/filter (shown when > 2 deployments)
- Per-deployment actions: rename (inline), redeploy (replace files), open externally, view files, delete
- "Live" badge shown when `index.html` is present
- Skeleton loading states during fetch

### 6. Site Viewer
- Preview tab: full iframe preview of the live site
- Files tab: list of all deployed files with type icons, copy URL, and open link
- macOS-style browser chrome around the iframe

### 7. Redeploy
- Clicking the refresh icon on any deployment sets it as the redeploy target
- Drop Zone shows the target name and "Update Site" CTA
- Old files are deleted from storage before new ones are uploaded
- Deployment record is updated in-place (same slug/URL preserved)

---

## Data Model

### `deployments` table (Postgres)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `slug` | text | Unique, URL-safe identifier (e.g. `swift-meadow-4829`) |
| `name` | text | Display name |
| `user_id` | uuid | FK → `auth.users` |
| `files_count` | integer | Number of files |
| `total_size` | bigint | Bytes |
| `has_index_html` | boolean | Enables live preview |
| `file_paths` | text[] | Relative paths of all uploaded files |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

RLS: users can only SELECT / INSERT / UPDATE / DELETE their own rows (`auth.uid() = user_id`).

### Supabase Storage — `sites` bucket

- Public bucket (files are readable by anyone with the URL)
- Files stored at `sites/{slug}/{relative-path}`
- 50 MB per-file limit
- Upload and delete restricted to authenticated users; delete restricted to the object owner

---

## URL Structure

Deployed files are served directly from Supabase Storage:
```
https://<project>.supabase.co/storage/v1/object/public/sites/{slug}/{path}
```
The site entry point (live preview URL) is:
```
https://<project>.supabase.co/storage/v1/object/public/sites/{slug}/index.html
```

---

## Slug Generation

Slugs are generated client-side as `{adjective}-{noun}-{4-digit-number}`, e.g. `swift-meadow-4829`. Word lists contain 48 adjectives and 48 nouns, giving ~110k unique combinations before the numeric suffix.

---

## Non-Goals (v1)

- Custom domains
- Password-protected deployments
- Usage/bandwidth analytics
- Team/shared deployments
- CI/CD or git-based deploys
- Server-side rendering or dynamic backends
- File size quotas per user

---

## Technical Architecture

```
Browser (React SPA)
  └── Supabase JS SDK
        ├── supabase.auth         — Google OAuth, session management
        ├── supabase.storage      — File upload/delete to `sites` bucket
        └── supabase.from(...)    — CRUD on `deployments` table
```

No backend server or edge functions. All logic runs client-side against Supabase's hosted Postgres and Storage APIs.

---

## Future Considerations

- **Custom domains** — CNAME mapping to the Supabase storage URL
- **Storage quotas** — per-user cap with a usage indicator in the header
- **Password protection** — optional passphrase on a deployment, enforced via an edge function proxy
- **QR code on success** — instant mobile sharing from the success screen
- **Sort/filter controls** — sort My Sites by name, date, or size
- **Deployment history** — track previous versions of a redeployed slug
