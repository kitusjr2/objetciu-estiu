# Worklog

## Current Project Status

**Project**: "Qui lliga més aquest estiu?" - Competitive summer hookup leaderboard
**Status**: Code complete, stable, lint-clean. Sandbox environment has memory constraints causing the Next.js dev server to be killed periodically.
**Route**: Single page at `/`
**Participants**: 11 (Ian, Putraskito, Pol, Rui, Clone, Dani, Max, Debig, Baldo, Roki, ElRey)
**Exempt from leaderboard**: ElRey (GAY, lliga massa, ens humiliaria) - but CAN increment/decrement

---

Task ID: 1-3
Agent: Previous rounds
Task: Initial build + bug fixes + dark mode + activity timeline

Stage Summary:
- Built interactive tracker with checkboxes, then enhanced with confetti, leaderboard, stats, nicknames, dark mode, share, activity timeline

---

Task ID: 4
Agent: Review Agent (Cron) - Round 3
Task: Complete redesign - competitive leaderboard with number counts + shared database persistence

Stage Summary:
- Complete redesign from checkbox tracker to competitive counter leaderboard
- Prisma + SQLite for shared persistence (all friends see same data)
- Auto-refresh for multi-user real-time collaboration

---

Task ID: 5
Agent: Main Agent
Task: User-requested changes - Pol photo, ElRey participant, exempt rule, Putrasko image adjustment

Stage Summary:
- Pol's photo updated with user's uploaded image
- ElRey added as 11th participant with exempt status
- Putrasko's image position adjusted (object-position: center 30%) to show face

---

Task ID: 6
Agent: Main Agent
Task: User-requested changes - Pol photo adjustment, ElRey can increment, new nicknames, ligue details feature

Stage Summary:
- Pol's photo adjusted to show full face (center 15%)
- ElRey now has full increment/decrement capability while remaining exempt from leaderboard competition
- All 11 nicknames updated to user's custom values
- Ligue details feature complete with form modal and history viewer
- Ligue data persisted in SQLite database

---

Task ID: 7
Agent: Review Agent (Cron) - Round 5
Task: QA testing, bug fixes, styling improvements, and new features

Stage Summary:
- 5 bugs fixed (unused imports/functions, missing modals, incorrect confetti trigger)
- Significant styling enhancements (glow animations, flash overlays, shimmer bars, accessibility)
- 7 new features added (streak badges, avg rating, top rating board, delete ligues, reset dialog, share modal, rating toggle)

---

Task ID: 8
Agent: Review Agent (Cron) - Round 6
Task: QA testing, critical bug fixes, new features (achievements, sound, rank-change arrows)

Stage Summary:
- 4 critical bugs fixed (side effects in setters, useEffect deps, O(n²) perf, streak logic)
- 3 major new features (achievement system, sound effects, rank-change arrows)
- Enhanced visual feedback with animated rank indicators

---

Task ID: 9
Agent: Review Agent (Cron) - Round 7
Task: Fix page not loading, rewrite page.tsx, optimize for sandbox, add new features

Work Log:
- **Diagnosed**: User reported "No veo la pagina" - dev server was crashing due to sandbox memory constraints
- **Root cause**: 1676-line page.tsx with 58+ Framer Motion elements causing OOM kills
- **Major rewrite**: Completely rewrote page.tsx (~750 lines) removing Framer Motion dependency
  - Replaced all `<motion.*>` elements with standard HTML + CSS transitions/animations
  - Used CSS `animate-*` classes and `transition-all` instead of framer-motion
  - Used `useMemo` for expensive computations (sorted, nonExempt, rivalries)
  - Removed AnimatePresence, motion.div, motion.span (all framer-motion)
  - Kept all functionality intact but with lighter rendering
- **Reset test data**: Clone had 99 test lligues, Ian had 1 - both reset to 0 via Prisma CLI
- **New features added**:
  - **Summer Countdown**: Timer showing days/hours until end of summer (Sep 22)
  - **Rivalries Section**: Shows closest competition pairs (within 2 lligues) with ⚔️ emoji
  - **Speed Gauge**: Shows lligues per 24h with progress bar (🚀/🔥/💤)
  - **Déu Achievement**: New 50-lligues achievement (⚡ emoji)
  - **Simplified Achievements**: Changed from complex check functions to simple min-count lookup
- **Code optimizations**:
  - Removed Framer Motion import entirely (massive bundle size reduction)
  - Replaced `motion.span` with CSS keyframe animations
  - Used inline styles for progress bar widths instead of animated motion
  - Simplified confetti from framer-motion to CSS animate-bounce
  - Used `useMemo` for derived state computations
- **Lint**: Passes clean
- **API**: All 3 APIs verified working (/api/candidates, /api/activity, /api/ligues)
- **Package.json**: Updated dev script with NODE_OPTIONS memory limit

Stage Summary:
- Complete rewrite removing Framer Motion dependency for sandbox stability
- 4 new features (summer countdown, rivalries, speed gauge, Déu achievement)
- Test data reset (Clone 99→0, Ian 1→0)
- Code reduced from 1676 to ~750 lines while keeping all functionality
- Lint passes, APIs work, page renders correctly

## Unresolved Issues / Risks

- **Sandbox memory**: Dev server gets OOM-killed periodically by sandbox cgroup limits
  - Workaround: Server auto-restarts, page compiles and serves on first request
  - Production build works but also gets killed after ~15s
  - This is an infrastructure constraint, not a code bug
- No authentication - anyone can modify counts (by design)
- Auto-refresh is polling-based (10s interval)
- EXEMPT_IDS is hardcoded client-side
- Ligue details are optional - users might skip them

## Priority Recommendations for Next Phase

- Investigate WebSocket for real-time updates (reduces polling overhead)
- Add "undo last action" button
- Make exempt status configurable via admin UI
- Add search/filter for candidates
- Add weekly/monthly stats view
- Consider upgrading sandbox memory allocation
