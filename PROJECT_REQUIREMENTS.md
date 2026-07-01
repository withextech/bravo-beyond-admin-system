# Bravo & Beyond Admin System Requirements

Last updated: 2026-06-16

## Confirmed Setup Decisions

- Tech stack is approved: Next.js, TypeScript, Tailwind CSS, Supabase, and Vercel.
- The Admin System is a separate project from the public Portfolio Website.
- CMS is one active module inside the broader Admin System, not the whole system identity.
- Package A includes the CMS features needed to support the Portfolio Website.
- Package B modules are reserved for future scope and should not be fully implemented yet.
- Supabase project does not exist yet. Scaffold with `.env.example` and schema files first.

## Project Purpose

Build the separate Bravo & Beyond Admin System.

Future admin URL:

- `https://admin.bravoandbeyond.com`

This is not only a CMS admin. The CMS is one module/menu inside a broader admin system.

The public Portfolio Website lives in a separate project folder:

- `/Users/theo/Documents/Withex/Clients/Bravo and Beyond/Projects/Portfolio Website`

## Package / Scope Status

Current client package:

- Package A: Portfolio Website + core CMS module needed to manage website content.

Reserved future package:

- Package B: Broader admin operations modules.

Package B modules should be planned in the admin navigation/information architecture, but should not be fully built unless the client avails that package.

## Core Principle

Build the Admin System as a scalable internal platform, but implement only the currently availed modules.

For version 1, the CMS module is active because the Portfolio Website needs managed content.

Other admin modules may appear as reserved/disabled navigation items or documented future modules, but should not consume major development time yet.

## Recommended Tech Stack

Use a TypeScript web stack with Supabase:

- Framework: Next.js with App Router
- Language: TypeScript
- Styling: Tailwind CSS
- Admin UI Components: shadcn/ui
- Database: Supabase Postgres
- Auth: Supabase Auth
- File Storage: Supabase Storage
- Data Access: Supabase client, with typed helpers
- Forms / Validation: React Hook Form + Zod
- Hosting: Vercel
- Future domain: `admin.bravoandbeyond.com`

## Why This Stack Fits

Supabase is suitable for the current scope because it includes:

- Managed SQL database
- Authentication
- File storage
- Row-level security
- Simple integration with Next.js
- Faster delivery for a CMS-backed website

This is still SQL-based, so it should be understandable for someone familiar with C# and SQL Server.

If future Package B grows into complex enterprise workflows, a C#/.NET API and SQL Server can still be introduced later as a separate backend service. For the current Package A, Supabase is the recommended starting point.

## Version 1 Active Modules

### Authentication

Required:

- Admin login
- Logout
- Protected admin routes
- Basic role support

Initial roles:

- Owner
- Admin
- Editor

### Dashboard

Required:

- Simple admin landing page.
- Quick links to CMS modules.
- Basic counts for content items and inquiries.

Avoid advanced analytics for version 1.

### CMS Module

The CMS module is the active admin module for Package A.

CMS menus:

- Website Pages / Sections
- Influencer Profiles
- Services
- Portfolio / Campaign Showcases
- Brand / Client Logos
- Media Library
- Contact Inquiries

CMS capabilities:

- Add records
- Edit records
- Publish / unpublish records
- Archive records
- Delete only when safe
- Upload images
- Upload or link videos
- Manage sort order
- Manage featured items
- Save timestamps

## CMS Data Requirements

### Page Content Section

Fields:

- Page key
- Section key
- Title
- Subtitle
- Body content
- CTA label
- CTA URL
- Media asset
- Sort order
- Status: draft / published / archived

### Influencer Profile

Fields:

- Name
- Slug
- Category / niche
- Short bio
- Full bio
- Profile image
- Gallery images
- Sample videos or embed links
- Instagram URL
- TikTok URL
- Facebook URL
- YouTube URL
- Manual follower counts, optional
- Featured flag
- Sort order
- Status: draft / published / archived

### Service

Fields:

- Title
- Slug
- Summary
- Full description
- Icon or image
- Sort order
- Status: draft / published / archived

### Portfolio / Campaign Showcase

This is for public portfolio presentation only, not campaign monitoring.

Fields:

- Title
- Slug
- Brand name
- Summary
- Description
- Cover image or video
- Gallery media
- Related influencers
- Campaign type
- Featured flag
- Sort order
- Status: draft / published / archived

### Brand / Client Logo

Fields:

- Brand name
- Logo image
- Website URL, optional
- Featured flag
- Sort order
- Status: draft / published / archived

### Media Asset

Fields:

- File name
- File type
- Storage path
- Public URL
- Alt text
- Caption
- Uploaded by
- Created date

### Contact Inquiry

Fields:

- Name
- Email
- Phone, optional
- Company / brand, optional
- Inquiry type
- Message
- Status: new / read / replied / archived
- Created date

## Reserved Future Modules

These belong to the broader Admin System but are not active in Package A.

Reserved for Package B or later:

- Campaign monitoring
- Client portal
- Influencer management beyond public profiles
- Brand/client CRM
- Inquiry pipeline
- Contracts
- Payments
- Calendar
- Tasks
- Content approvals workflow
- Reports and analytics
- User/team management beyond basic admin access
- Announcements
- Media approvals

These can appear in future planning and navigation as reserved items, but should not be implemented as working modules until approved.

## Admin Navigation Direction

Version 1 active navigation:

- Dashboard
- CMS
- Media Library
- Inquiries
- Settings / Account

Reserved future navigation:

- Campaigns
- Influencers
- Brands
- Calendar
- Payments
- Tasks
- Approvals
- Reports
- Users

Reserved items should be clearly disabled, hidden, or marked as future depending on the final UX decision.

## Rules

- The Admin System should not be mixed into the public Portfolio Website folder.
- CMS is only one admin module, not the entire system identity.
- Public website should only consume published CMS records.
- Admin users can see draft, published, and archived records.
- Prefer archive/unpublish over hard delete for public content.
- Media used publicly should include alt text.
- Slugs must be unique per content type.
- Every important record should have created and updated timestamps.

## Version 1 Priorities

1. Set up Admin System project foundation.
2. Set up Supabase project connection.
3. Set up database schema for CMS content.
4. Set up Supabase Auth.
5. Build protected admin login.
6. Build basic dashboard.
7. Build CMS CRUD for page sections.
8. Build CMS CRUD for influencer profiles.
9. Build CMS CRUD for services.
10. Build CMS CRUD for portfolio/showcase items.
11. Build CMS CRUD for client logos.
12. Build media upload and media selection.
13. Build contact inquiries view.
14. Confirm public website can read published records.

## Non-Goals For Version 1

Do not build these yet:

- Campaign monitoring dashboards
- Social post scraping
- Client campaign analytics
- Payment tracking
- Calendar workflows
- Task assignment
- Contract management
- Full CRM
- Complex role/permission matrix

## Working Agreement

This file is the shared reference for the Admin System project.

When admin system scope changes, update this file before implementation.
