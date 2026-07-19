# Ne-goshow Development Roadmap 🚀

## Phase 1: Frontend Modularization (Tackling Technical Debt)
Currently, all screens and logic reside inside a single `App.tsx` file. We need to leverage Next.js App Router capabilities to make the codebase maintainable for the team.

- [ ] **Component Extraction:** Break down `App.tsx` into reusable React components inside `src/components/` (e.g., `Sidebar.tsx`, `CommodityCard.tsx`, `ChartWidget.tsx`, `UploadForm.tsx`).
- [ ] **Routing Setup:** Migrate the custom screen state (`"home" | "dashboard" | "admin"`) to actual Next.js routes:
  - `src/app/page.tsx` (Home/Landing)
  - `src/app/dashboard/page.tsx` (Analytics)
  - `src/app/admin/page.tsx` (Admin Panel)
- [ ] **State Management:** Implement proper React Context or a lightweight state manager (like Zustand) if global state is still required across pages.

## Phase 2: Database Schema Expansion
Our `prisma/schema.prisma` only has an `AdminUser`. We need to design the data layer to support the interfaces defined in our frontend.

- [ ] **Define Models:** Translate frontend interfaces into Prisma models:
  - `Commodity`: To store name, baseline, trends, and volatility.
  - `PriceSource`: To track different market prices for a commodity.
  - `BulletinRecord`: To store uploaded PDF/Image bulletins.
  - `ValidationDecision`: To track admin approvals/rejections of price flags.
- [ ] **Migration:** Run `npx prisma migrate dev` to push these changes to our Supabase PostgreSQL database.
- [ ] **Seeding:** Create a `prisma/seed.ts` script to populate the database with our current static data (e.g., Red Onion, White Onion) so the team has realistic data to work with.

## Phase 3: API & Backend Integration
We need to replace the static arrays and browser-based state with real server interactions. Since a Java backend is planned for production, we will build a clean service layer.

- [ ] **Service Layer Creation:** Create a `src/services/` folder to abstract all API calls. This ensures that when we switch from Next.js APIs/Supabase to the Java backend, we only change the code in one place.
- [ ] **Next.js API Routes (Interim Backend):** Create `src/app/api/...` routes to handle CRUD operations via Prisma (e.g., `GET /api/commodities`, `POST /api/bulletins`).
- [ ] **Data Fetching:** Update frontend components to use `fetch` (or SWR/React Query) to get data from our endpoints instead of local variables.

## Phase 4: Authentication & Security
The current admin login is hardcoded (`admin`/`admin123`). We need a secure authentication flow.

- [ ] **Auth Implementation:** Integrate NextAuth.js or use Supabase Auth directly to handle secure admin sessions.
- [ ] **Route Protection:** Use Next.js middleware (`middleware.ts`) to ensure non-authenticated users cannot access the `/admin` routes.
- [ ] **Password Hashing:** Ensure any newly created `AdminUser` accounts in Prisma have their passwords hashed (e.g., using `bcrypt`).

## Phase 5: File Storage & Pipelines
The admin upload functionality needs a place to store files securely.

- [ ] **Storage Setup:** Configure Supabase Storage buckets (or AWS S3) for storing uploaded bulletin PDFs and Images.
- [ ] **Upload API:** Create an endpoint that receives a file from the frontend, uploads it to the storage bucket, and saves the file URL to the `BulletinRecord` in Prisma.
- [ ] **AI Pipeline Hookup:** (If applicable) Prepare the webhooks or event triggers for when a document is uploaded, so it can be processed by the AI ingestion pipeline mentioned in our docs.

Or

# Ne-goshow High-Level Project Plan

This document outlines the strategic phases for developing the Ne-goshow MVP. It focuses on the objectives and deliverables for each phase rather than the low-level code implementation details.

## Phase 1: Frontend Modularization (Recommended Next Step)
**Objective:** Resolve technical debt by breaking down the monolithic `App.tsx` (1600+ lines) into a maintainable Next.js App Router structure.
- **Component Extraction:** Separate UI elements (e.g., Cards, Charts, Forms, Navigation) into reusable React components.
- **Routing:** Transition from custom state-based navigation to native Next.js routes (`/`, `/dashboard`, `/admin`, `/transparency`).
- **State Management:** Implement a clean state management solution (React Context or Zustand) to share data across routes seamlessly.

## Phase 2: Database Schema & Seeding
**Objective:** Prepare the Supabase PostgreSQL database to handle the application's data dynamically.
- **Data Modeling:** Define Prisma schemas for Commodities, Price Sources, Bulletin Records, and Validation Decisions.
- **Migrations:** Apply the schema to the Supabase instance.
- **Seeding:** Create seed scripts with initial mock data (e.g., Red Onion, White Onion baseline prices) so the frontend has reliable data to consume during development.

## Phase 3: Backend Services & API Integration
**Objective:** Replace hardcoded frontend arrays with live data fetched from the database.
- **Service Layer:** Build a clean abstraction for database queries.
- **Next.js API Routes:** Expose RESTful endpoints (e.g., `GET /api/commodities`, `POST /api/bulletins`) for the frontend to consume.
- **Data Fetching:** Update components to retrieve and display data asynchronously.

## Phase 4: Authentication & Security
**Objective:** Secure the admin panel and sensitive operations.
- **Admin Auth:** Integrate Supabase Auth or NextAuth.js for robust session management.
- **Route Protection:** Use Next.js Middleware to restrict access to `/admin` routes.
- **Security:** Ensure passwords and sessions are handled securely.

## Phase 5: File Storage & Pipelines
**Objective:** Enable administrators to upload and manage bulletins.
- **Storage Buckets:** Configure Supabase Storage for PDFs and images.
- **Upload Endpoints:** Build APIs to handle file streams and associate them with database records.
- **Pipeline Hooks:** Prepare webhooks for future AI ingestion processes.
