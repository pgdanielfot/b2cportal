## B2C Portal

Internal FOT team defines campaign-info "products" (multi-step forms with
text/textarea/URL/date/dropdown/file fields). For each SO number, FOT
generates a no-login shareable link that a B2C/Agent fills out. FOT reviews
submissions, exports them as CSV, and can archive/delete them.

### Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma ORM + Postgres
- NextAuth (credentials) for FOT login
- File uploads: Vercel Blob in production, local disk in local dev

### Local development

1. Get a Postgres connection string — easiest is to create a **Vercel Postgres**
   database (see deployment steps below, you can create it before deploying)
   and use the same connection string locally. Paste it into `.env`:
   ```
   DATABASE_URL="postgresql://..."
   ```
2. Install dependencies and run migrations:
   ```bash
   npm install
   npx prisma migrate dev --name init
   npm run db:seed
   ```
   Default seeded login: `admin@propertyguru.com.my` / `changeme123`
   (override via `SEED_FOT_EMAIL` / `SEED_FOT_PASSWORD` in `.env`).
3. Start the app:
   ```bash
   npm run dev
   ```

File uploads work without any extra setup locally — they're written to
`uploads/` (gitignored) and served through an authenticated route. Only set
`BLOB_READ_WRITE_TOKEN` in `.env` if you specifically want to test against
Vercel Blob locally too.

### Deploying to Vercel

**1. Push this project to GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
```

Create a new empty repo at [github.com/new](https://github.com/new) (don't
initialize it with a README), then:

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

**2. Import the project into Vercel**

- Go to [vercel.com/new](https://vercel.com/new)
- Import the GitHub repo you just pushed
- Framework preset should auto-detect as Next.js — leave build settings default
- Don't click Deploy yet — set up storage first (next steps), then deploy

**3. Add a Postgres database**

- In the Vercel project → **Storage** tab → **Create Database** → **Postgres**
- This automatically sets `DATABASE_URL` (and a few related vars) in your
  project's environment variables — no manual copy-paste needed

**4. Add Blob storage (for file uploads)**

- Same **Storage** tab → **Create Database** → **Blob**
- This automatically sets `BLOB_READ_WRITE_TOKEN` in your environment
  variables

**5. Set the remaining environment variables**

In Project Settings → Environment Variables, add:

| Name | Value |
|---|---|
| `AUTH_SECRET` | Generate with `npx auth secret` — must be a real random value, not the local dev placeholder |
| `SEED_FOT_EMAIL` | The FOT login email you want (optional, only used by the seed script) |
| `SEED_FOT_PASSWORD` | The FOT login password you want (optional, only used by the seed script) |

**6. Deploy**

- Click **Deploy**. The build runs `prisma migrate deploy && next build`
  (see `vercel-build` in `package.json`), which automatically applies the
  database schema to your new Postgres database — no manual migration step
  needed.

**7. Create your first FOT login**

The seed script only runs locally, not automatically during Vercel builds.
After deploying, run the seed once against the production database from your
own machine:

```bash
DATABASE_URL="<paste production DATABASE_URL from Vercel>" npm run db:seed
```

(On Windows PowerShell: `$env:DATABASE_URL="<url>"; npm run db:seed`)

You can find the production `DATABASE_URL` in Vercel → Storage → your
Postgres database → `.env.local` tab.

**8. Done**

Visit your Vercel deployment URL, sign in with the FOT credentials you just
seeded, create a product, generate a shareable link, and test the full flow.

### Notes / follow-ups

- No email/Slack notification on submission yet — add one in
  `submitFillForm` (`src/app/actions/submissions.ts`) if needed.
- To rotate the FOT admin password later, either re-run the seed script with
  new `SEED_FOT_EMAIL`/`SEED_FOT_PASSWORD` values, or add a proper
  admin-managed user flow if you'll have multiple FOT users.
