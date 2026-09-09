# Vercel Deployment

## Project setup

Import `https://github.com/karankhatri29/Portfolio` into Vercel as a Next.js project. Vercel will use `vercel.json` and the `master` branch by default.

## Required environment variables

Configure these in Vercel Project Settings for Preview and Production environments:

- `AUTH_SECRET`: long random secret used to encrypt Auth.js sessions.
- `AUTH_OWNER_EMAIL`: exact owner email that receives the `Admin` role.
- `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`: Google OAuth credentials.
- `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`: GitHub OAuth credentials.

Set provider callback URLs to:

- `https://<your-vercel-domain>/api/auth/callback/google`
- `https://<your-vercel-domain>/api/auth/callback/github`

## Important persistence note

The current Admin CRUD plan uses a local server-side data file for development. Vercel functions do not provide durable writable local storage. Before enabling production Admin mutations, move the repository boundary to a hosted database or CMS such as Vercel Postgres, Neon, Supabase, or another managed store.

## Local verification

```powershell
npm ci
npm run lint
npm test -- --runInBand
npm run build
```
