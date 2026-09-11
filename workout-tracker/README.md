# Workout Tracker (local-first)

- Mobile-first workout logging, with the in-progress workout saved as you go
- Day templates, plus swap/add/reorder exercises mid-workout
- "Previous" column showing last time's sets, tap to copy
- Editable exercise library
- Profiles (phone-specific)
- Best sets and a top-set progress chart per exercise
- Export (CSV/JSON) and full backup/restore

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
