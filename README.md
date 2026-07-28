# Ne-goshow

Ne-goshow is a frontend MVP designed for managing bulletins, validation decisions, and admin login. The UI connects to a live Supabase PostgreSQL database, using React Query and Prisma for data fetching and mutations, while the Admin dashboard is secured by Next.js Middleware and NextAuth.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS v4
- **Database ORM:** Prisma
- **Database Hosting:** Supabase (PostgreSQL)
- **Data Fetching:** React Query (`@tanstack/react-query`)
- **Authentication:** NextAuth.js

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Because this project connects to a real database and uses secure API keys, you must configure your local environment.

1. Copy the `.env.example` file and rename it to `.env.local`.
2. Request the real Supabase keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) and database URL from the project owner.
3. Generate a local NextAuth secret by running the following command in your terminal:
   ```bash
   openssl rand -base64 32
   ```
   Paste the output into the `NEXTAUTH_SECRET` variable.
4. **Note:** Place your `DATABASE_URL` inside a file named `.env`, and all other variables inside `.env.local`.

### 3. Sync the Database
Once your environment variables are configured, pull the latest database schema to generate the local Prisma client:
```bash
npx prisma generate
```
*(Note: Only run `npx prisma db push` if you are actively modifying the schema and own the database instance. Otherwise, `generate` is sufficient to sync types.)*

### 4. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## Project Structure Overview
- `src/app/`: Next.js App Router pages and API routes.
  - `api/`: Backend endpoints interacting with Prisma.
  - `dashboard/`, `advisor/`, `procurement/`, `checker/`: Main application screens.
- `src/lib/`: Utility functions, constants, and Prisma client setup.
- `prisma/`: Database schema (`schema.prisma`) and migration files.

---

## Available Scripts
- `npm run dev` - Starts the development server.
- `npm run build` - Builds the application for production.
- `npm start` - Starts the production server.
- `npm run lint` - Runs ESLint to check for code issues.

---

## Demo Admin Login
To access protected admin routes and features:
- **Username:** `admin`
- **Password:** `admin123`
