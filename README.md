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
Because we are dealing with a real database and API keys, you **cannot** push your secret keys to GitHub.

I have created an `.env.example` file in the project. 
1. Copy that file and rename it to `.env.local`.
2. Ask Pete for the real Supabase keys and database URL.
3. Generate your own local NextAuth secret by running `openssl rand -base64 32` in your terminal and paste it into `NEXTAUTH_SECRET`.

*(Note: Put your `DATABASE_URL` inside a file named `.env`, and everything else inside `.env.local`).*

### 3. Sync the Database
Once your `.env` file is set up, you need to pull the latest database structure to your local Prisma client.

```bash
npx prisma generate
```

*(Note: Only the project owner needs to run `npx prisma db push` when modifying the schema. If you are just pulling their changes, `generate` is enough!)*

### 4. Start the Server!
Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production build
```bash
npm run build
npm start
```

## Demo admin login
- Username: `admin`
- Password: `admin123`

## Notes
This project is fully connected to a live Supabase PostgreSQL database. The UI fetches real data using React Query and Prisma, and the Admin dashboard is secured by Next.js Middleware and NextAuth.
