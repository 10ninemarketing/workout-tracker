# Workout Tracker (local-first)

- Mobile-first workout logging
- Editable exercise library
- Profiles (phone-specific)
- PRs via estimated 1RM (Epley or Brzycki)
- Export/Import backup

## Local dev

1. Install Node.js (LTS).
2. In this folder:

```bash
npm install
npm run dev
```

## Deploy on Vercel

1. Push this repo to GitHub.
2. In Vercel: **Add New Project** → import this repo.
3. Framework preset: **Vite** (Vercel will detect it).
4. Build command: `npm run build`
5. Output directory: `dist`

Then open the URL on your phone.
