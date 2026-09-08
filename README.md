# Foundary — AI App Builder

Turn a prompt into a living app. Describe what you want, and Foundary writes the code, picks the packages, and renders a live preview — right inside your browser.

## Features

- **AI app generation** from natural language prompts (powered by Gemini)
- **Live preview** with Sandpack — see and run your app instantly in the browser
- **Improve with Agent** — send feedback and let Cline-like AI iterate on the generated code
- **Chat-first workspace** with a chat panel and a code/preview panel (responsive, v0-style tabs on mobile)
- **One-click export** — download the generated app as a Vite + React project (`zip` with `package.json`, `index.html`, and `.jsx` sources)
- **Credits & plans** — free credits per user, upgrade to Pro/Starter via the pricing modal
- **Projects & history** — every workspace is saved, revisit or share later
- **Auth** handled by Clerk (sign in / sign up / user account)
- Rate limiting & abuse protection via Arcjet, data storage via PostgreSQL (Prisma), file uploads via Supabase Storage

## Tech Stack

- [Next.js](https://nextjs.org) 16 (App Router)
- [React](https://react.dev) 19 + TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4 + shadcn/ui-style components
- [Motion](https://motion.dev) (framer-motion) & [Lenis](https://github.com/darkroomengineering/lenis) for smooth, cinematic scrolling
- [Sandpack](https://sandpack.codesandbox.io) for in-browser code editing & preview
- [Prisma](https://www.prisma.io) + PostgreSQL
- [Clerk](https://clerk.com) auth
- [Arcjet](https://arcjet.com) security
- [Gemini](https://ai.google.dev) (`@google/genai`) for code generation
- [JSZip](https://stuk.github.io/jszip/) for project export

## Getting Started

### Prerequisites

- Node.js 20+
- A PostgreSQL database (local or hosted, e.g. Neon, Vercel Postgres)
- Accounts/keys for the services below

### 1. Install dependencies

```bash
npm install
```

This runs `prisma generate` automatically after install.

### 2. Configure environment variables

Rename/copy your `.env` file and fill in the values:

```env
# Clerk (https://clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_SIGN_IN_URL=/sign-in
CLERK_SIGN_UP_URL=/sign-up

# PostgreSQL connection string (used by Prisma)
DATABASE_URL=

# Gemini API key for code generation
GEMINI_API_KEY=

# Arcjet protection
ARCJET_KEY=

# Supabase (file/image uploads)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 3. Set up the database

```bash
npx prisma migrate dev
# or, to sync the schema directly:
npx prisma db push
npx prisma generate
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Start the development server         |
| `npm run build`        | Create a production build            |
| `npm run start`        | Start the production server          |
| `npm run lint`         | Run ESLint                           |
| `npm run typecheck`    | Run TypeScript checks (`tsc --noEmit`) |

## Project Structure

```
app/
  (main)/                 # Authenticated pages (workspace, projects)
  (auth)/                 # Clerk sign-in / sign-up pages
  api/                    # Route handlers (gen-ai-code, improve, ...)
  page.tsx                # Public landing page
  not-found.tsx           # Custom 404 page
components/
  ChatPenal.tsx           # Chat panel (prompt + AI responses)
  CodePenal.tsx           # Code/preview panel + zip export
  WorkspaceClient.tsx     # Responsive workspace layout
prisma/
  schema.prisma           # User & Workspace models
lib/
  constants.ts            # Plans, credits, app-wide config
  checkUser.ts            # Creates/updates the DB user from Clerk
```

## How It Works

1. Sign in and describe the app you want (or use a suggestion).
2. Foundary streams a response: it writes the code and installs the right packages.
3. Watch the live preview update; switch messages to come back to an earlier version.
4. Ask **Improve with Agent** with natural-language feedback to refine the result.
5. Hit **Download** to export a runnable Vite + React project, or create a new workspace to start again.

.