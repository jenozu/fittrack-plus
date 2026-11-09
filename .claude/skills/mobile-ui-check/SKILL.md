---
name: mobile-ui-check
description: Check a FitTrack+ frontend change works on a phone-sized screen before calling it done - build, lint, and a manual checklist at 390x844. Use for any task that changes frontend/src.
paths:
  - "frontend/src/**"
---

# Phone-screen check

Automated (run them, report results):
1. `cd frontend && npm run build` — must pass with no errors.
2. `npm run lint` — fix new warnings in files you touched.
3. `npm test` if vitest is set up (task 14 adds it).

Manual: you can't see a phone. Give the human this checklist, filled in for the screen you changed:
- [ ] Chrome devtools → device toolbar → 390×844 (iPhone 14). Reload.
- [ ] No horizontal scrolling; nothing hidden under the bottom navigation or the iPhone home bar (safe-area padding).
- [ ] Every button/row is easy to tap with a thumb (≥ 44 px tall); inputs don't zoom the page on focus (font-size ≥ 16 px).
- [ ] Numeric inputs open the number keyboard (`inputMode="decimal"`).
- [ ] Loading state, empty state and error state (stop the backend) all look intentional.
- [ ] <the specific flow this task added, step by step, with expected results>
- [ ] After deploy: same flow on the real phone, in the installed home-screen app.

Design constraints: keep the pastel theme in `frontend/src/config/theme.js`; one primary action per screen; bottom
sheets for pickers; no new UI library without a PRD decision.
