# TypoGym

TypoGym is a typing trainer built with Next.js App Router. It supports normal practice and targeted practice (letter/finger), with session analytics persisted in local storage.

## Features

- Normal and targeted typing modes
- Configurable durations (`30s`, `60s`, `120s`)
- Real-time metrics and weak-letter analytics
- Local progress persistence via Zustand + localStorage
- Production-ready SEO metadata, `robots.txt`, `sitemap.xml`, and web manifest

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 4
- Zustand

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Run dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

- `NEXT_PUBLIC_SITE_URL`: Public canonical site URL used for metadata, robots, and sitemap.
  - Local example: `http://localhost:3000`
  - Production example: `https://your-domain.com`

## SEO + Production Files

- `app/layout.tsx`: canonical metadata, Open Graph, Twitter, robots directives
- `app/robots.ts`: generates `robots.txt`
- `app/sitemap.ts`: generates `sitemap.xml`
- `app/manifest.ts`: generates `manifest.webmanifest`
- `app/viewport.ts`: production viewport + theme color
- `next.config.ts`: strict mode + security headers + disabled `x-powered-by`
- `lib/site.ts`: centralized site config and URL normalization

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - run lint checks
- `npm run test` - run unit tests

## Production Deployment Checklist

1. Set `NEXT_PUBLIC_SITE_URL` to your final production domain.
2. Run `npm run lint`.
3. Run `npm run test`.
4. Run `npm run build`.
5. Deploy and verify:
   - `/robots.txt`
   - `/sitemap.xml`
   - `/manifest.webmanifest`
6. Submit sitemap to Google Search Console and Bing Webmaster Tools.

## Deployment

Deploy on any Node-capable platform (Vercel, Railway, Render, VPS, etc).

Typical production flow:

```bash
npm ci
npm run build
npm run start
```
