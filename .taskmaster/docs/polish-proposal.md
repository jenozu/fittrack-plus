# Polish + features proposal (2026-11-11) — awaiting owner approval

Tasks 20–27 in tasks.json. Nothing is built until the owner approves. Build happens on branch `polish`, never pushed to main.

## PRD fit of candidate features
| Candidate | PRD | Verdict |
|---|---|---|
| Copy yesterday's day / a meal from a past day | In scope ("Copy yesterday's meal"); backend copy already takes any from_date, optional meal | Task 25 |
| Verified/common foods first in search | In scope (ranking); fixes the 17.5 OFF-duplicates issue | Task 26 |
| Weight trend with 7-day average | In scope (weight trend chart) | Part of task 23 |
| Macros by day in Progress | In scope (goals and progress) | Part of task 23 |
| Recent + Favourites per meal | Recent in scope; Favourites is new but not a non-goal | Task 27 (decision-log line + new table) |
| Custom foods shared between users | **Conflicts**: PRD "Custom foods per user (private)", non-goal "sharing"; rules.md "private to created_by_user" | Not added |

Also non-goals (not on the list): AI photo scan (also a per-call cost), meal plans/recipes, water, exercise; steps doesn't exist in code.

What sharing custom foods would need: a decision-log entry rewording the custom-foods line and the sharing non-goal
(household of two, not social); the rules.md privacy line; a forward-only migration (shared flag or household table);
search/custom-food endpoint changes plus tests showing a third user still can't see them. About one medium task.

## UI audit (screenshots at 375 and 1280, seeded local user)
Verdict: Today's hierarchy (big kcal remaining, plain meal lists) works. The rest reads as assembled from different
kits: four competing accents, two diary screens, template parts.

P0
1. Two diary screens: Today and Add (/food) both show totals + meals in different styles (gradient card, blue/green/pink
   buttons, "1 serving" on every row, red trash per row).
2. Contrast: white on pastel pink ("Log", "Add Manually") and the pale-blue active nav tab are far below 4.5:1.
3. Progress weight form doesn't fit at 375 (placeholder "Toda", select "30 c"); two period controls.

P1
4. No colour roles: main action is black on Today, green on Add, pink on Progress; active nav baby blue.
5. Progress template parts: three 3D-emoji stat cards incl. "Total Burned 0"; title wraps to three lines beside a gradient bubble.
6. Profile: raw floats (167.92499999999998), every field greyed until "Edit Profile", one-off coloured left borders, filler copy.
7. No type scale: headings wrap ("Food Log" beside the date input), small text varies by page, numbers not tabular.
8. Logo is still "F+" from FitTrack+.

P2
9. Macro bars all the same pink; "Copy yesterday's breakfast" wraps at 375; faint "Nothing yet"; generic section names.

Bugs found: chart dates one day early (YYYY-MM-DD parsed as UTC); the calorie Target line never draws (Line inside BarChart).

## Proposed tasks
Phase 5, design polish: 20 remove burned chart/card + fix target line (S) · 21 design foundation (M) ·
22 one diary, search-first Add (L, split first) · 23 Progress polish (M) · 24 Profile polish (M).
Phase 6, features: 25 copy day/meal (S) · 26 search ranking (M–L) · 27 Recent + Favourites per meal (M, migration).
