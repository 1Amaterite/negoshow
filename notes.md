# Negoshow Project Updates & Changelog

Hey team! I've just completed a massive update to our codebase that bridges the gap between our frontend design and our real backend database. I've completely removed the fake hardcoded data and connected our main screens directly to the APIs. 

Below is a detailed breakdown of everything that was changed, file by file, so everyone is on the same page.

---

## 1. Connecting the Frontend to the Real Database
*Previously, we were importing a massive list of fake commodities from `src/lib/data.ts`. Now, we use a tool called `React Query` (`@tanstack/react-query`) to fetch the real data straight from our backend APIs.*

### 📄 `src/app/page.tsx` (Home Screen)
- **What changed:** Removed the old `COMMODITIES` import. I added a `useQuery` hook to hit `/api/commodities` to grab real prices.
- **Why it matters:** The home screen's "Volatile Today" and "Most Stable" widgets now show accurate data from the database. I also added a loading state so the page doesn't crash while waiting for the data to load.

### 📄 `src/app/advisor/page.tsx` (Negoshow Advisor)
- **What changed:** Replaced the hardcoded commodity data with a live fetch to `/api/commodities`. 
- **Why it matters:** When a user clicks to get advice on a specific crop, the app now pulls the live baseline price and calculates if they should "buy", "wait", or "negotiate" based on real-time numbers. Added loading states.

### 📄 `src/app/procurement/page.tsx` (Procurement Dashboard)
- **What changed:** Completely swapped out `COMMODITIES` for `dynamicCommodities` via the API. 
- **Why it matters:** The entire procurement table, the potential savings calculations, and the recommendation cards are now 100% driven by live data.

### 📄 `src/app/commodity/[id]/page.tsx` (Commodity Details Screen)
- **What changed:** Connected the page to `/api/commodities` to get the live details of a specific crop.
- **Why it matters:** The price history chart and source list are now accurate based on database entries.

---

## 2. Dynamic Locations & Price Checker
*The Price Checker previously relied on a hardcoded list of locations (like "Pasay City"). It now talks to the database to find out which markets actually exist.*

### 📄 `src/app/api/markets/route.ts` (NEW FILE)
- **What changed:** I created a brand new API endpoint.
- **Why it matters:** It runs `prisma.market.findMany()` to fetch all the real markets we have saved in Supabase.

### 📄 `src/app/checker/page.tsx` (Price Checker Screen)
- **What changed:** Instead of a hardcoded array, the location dropdown now fetches the market list from `/api/markets`. 
- **Why it matters:** When a user submits a price check, we now send the real database `market.id` to the `/api/check-price` and `/api/analytics/peers` endpoints instead of always sending a hardcoded `1`. This makes our peer comparison math accurate!

---

## 3. Prettier Charts & UI Fixes
*We had an issue where large numbers looked weird on our charts (e.g., 1200 instead of 1,200).*

### 📄 `src/app/dashboard/page.tsx` & `src/app/commodity/[id]/page.tsx`
- **What changed:** I updated the `YAxis` on all our Recharts (`BarChart` and `LineChart`).
- **Why it matters:** I used JavaScript's `Intl.NumberFormat('en-US')` to automatically format the chart labels. Prices now show up beautifully as `₱1,200` with commas, which looks much more professional to users.

---

## 4. Securing the Admin Area (Security)
*We needed to make sure nobody could view or mess with our database data without being logged in.*

### 📄 `src/middleware.ts`
- **What changed:** I updated the NextAuth matcher rules. I added `/api/admin/:path*` to the list of protected routes.
- **Why it matters:** Previously, only the frontend `/admin` pages were protected. Now, even if a hacker tries to directly access our admin API endpoints, they will be completely blocked if they don't have an active session.

---

## 5. Cleaning Up the Junk (Tech Debt)
*With the real database connected, we didn't need all the old setup files anymore.*

### 📄 `src/lib/data.ts` (DELETED)
- **What changed:** I completely deleted this massive file!
- **Why it matters:** Our codebase is much cleaner. No more confusing fake data mixing with real data.

### 📄 `src/lib/constants.ts` (NEW FILE)
- **What changed:** I moved the few static things we still need (like UI labels, `DOC_STATUS` colors, and `VENDOR_TIPS` text) from the old `data.ts` file into this new, lightweight file.

### 📄 `src/lib/types.ts`
- **What changed:** Removed old, unused TypeScript definitions (`BulletinRecord`, `AdminRecord`, `UploadedDoc`).
- **Why it matters:** Less clutter! We only kept what we actually use, avoiding conflicts with Prisma's auto-generated types.

---

**Summary:** We are now completely running on real data from Supabase, our admin API routes are fully secured, the charts look beautiful, and our codebase is much lighter and easier to read!
