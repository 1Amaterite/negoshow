# Ne-goshow

## Tech Stack
- **Frontend & Backend Framework:** Next.js
- **Styling:** Tailwind CSS v4
- **Database ORM:** Prisma
- **Database Hosting:** Supabase (PostgreSQL)

---

## Setup 

### 1. Install Dependencies
npm install


### 2. Set Up Environment Variables
Because we are dealing with a real database and API keys, you **cannot** push your secret keys to GitHub. You must create two files locally.

**Create a `.env.local` file** in the root folder and add the Supabase keys (Ask the project owner for the real keys!):
Make a .env.local file

If you need the url, and anon key, ask Pete.

NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"


**Create a `.env` file** in the root folder and add the Database Pooler URL:
Make a .env file

If you need the url, ask Pete

DATABASE_URL="postgresql://postgres.[project-ref]:[URL-ENCODED-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

### 3. Sync the Database
Once your `.env` file is set up, you need to pull the latest database structure to your local Prisma client.

npx prisma generate

*(Note: Only the project owner needs to run `npx prisma db push` when modifying the schema. If you are just pulling their changes, `generate` is enough!)*

### 4. Start the Server!
Run the development server:
npm run dev

Open [http://localhost:3000](http://localhost:3000) in your browser, or what localhost you are using

## Production build
npm run build
npm run preview

## Demo admin login
- Username: `admin`
- Password: `admin123`

## Notes
This is a working frontend MVP. Uploaded bulletins, validation decisions, and login state are kept in the browser session only. Connect the UI to your Java backend before production deployment.
