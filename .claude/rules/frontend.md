---
paths:
  - "frontend/**/*.{js,jsx,css,html}"
  - "frontend/vite.config.js"
---

# Frontend rules (React 18 + Vite + Tailwind)

- Phone first: design at 390 px wide, then check desktop. Tap targets ≥ 44 px, input font-size ≥ 16 px.
- All API calls go through `frontend/src/services/api.js`; base URL comes from `VITE_API_URL` (`/api` in production).
  Encode query params; cancel stale search requests with AbortController.
- Hidden features are controlled by `frontend/src/config/features.js`. Don't render or route to a flagged-off feature.
- The service worker must never cache `/api/` responses (NetworkOnly).
- Camera/barcode code must stop all media tracks on unmount and on close.
- Keep the theme in `src/config/theme.js`; no new UI or state libraries without a PRD decision.
- Before reporting done: `npm run build` and `npm run lint` pass, plus the `mobile-ui-check` checklist.
