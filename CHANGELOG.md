# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - Database Integration & Security Update

This major update bridges the gap between the frontend MVP design and the real backend database. Fake hardcoded data has been completely removed in favor of live API integrations.

### Added
- **Dynamic Locations & Price Checker:** Added a new API endpoint `src/app/api/markets/route.ts` that uses `prisma.market.findMany()` to fetch real markets from Supabase.
- **`src/lib/constants.ts`:** Created a new lightweight file to store static UI labels, `DOC_STATUS` colors, and `VENDOR_TIPS` text.

### Changed
- **Home Screen (`src/app/page.tsx`):** Replaced static `COMMODITIES` import with a `useQuery` hook hitting `/api/commodities` for live prices. Added loading states.
- **Advisor Screen (`src/app/advisor/page.tsx`):** Replaced hardcoded commodity data with live fetch to `/api/commodities` to calculate "buy/wait/negotiate" advice accurately. Added loading states.
- **Procurement Dashboard (`src/app/procurement/page.tsx`):** Swapped `COMMODITIES` for `dynamicCommodities` via the API. Tables and savings calculations are now 100% data-driven.
- **Commodity Details (`src/app/commodity/[id]/page.tsx`):** Connected to `/api/commodities` for accurate price history charts and source lists based on DB entries.
- **Price Checker (`src/app/checker/page.tsx`):** Location dropdown now fetches from `/api/markets`. Submissions now send real `market.id` to analytics endpoints for accurate peer comparison math.
- **Charts Formatting (`src/app/dashboard/page.tsx` & `src/app/commodity/[id]/page.tsx`):** Updated the `YAxis` on Recharts. Applied `Intl.NumberFormat('en-US')` so prices display cleanly (e.g., `₱1,200`).
- **Security (`src/middleware.ts`):** Updated NextAuth matcher rules to include `/api/admin/:path*`, securing admin API endpoints from unauthorized direct access.
- **Types (`src/lib/types.ts`):** Cleaned up unused definitions (`BulletinRecord`, `AdminRecord`, `UploadedDoc`) to prevent conflicts with Prisma's auto-generated types.

### Removed (Tech Debt Cleanup)
- **`src/lib/data.ts`:** Completely deleted this massive file as the project no longer relies on fake hardcoded data.
