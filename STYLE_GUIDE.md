# DSIGDT Style Editing Guide

## 1) Cohesive Group Edits (Main Cards)
These controls are for editing these cards together:
- `My Tasks`
- `Timer`
- `Statistics`
- `Neat Stuff I Got Done Today!`

Edit the `--group-*` variables in `styles.css` under `:root`:
- `--group-font-family`
- `--group-title-color`
- `--group-title-size`
- `--group-title-letter-spacing`
- `--group-card-fill-gradient`
- `--group-card-border-gradient`
- `--group-card-shadow`
- `--group-control-gradient`
- `--group-control-border`
- `--group-control-shadow`

These variables feed the main selectors:
- `.tab-content` (card shell)
- `.section-title` (card titles)
- controls using `var(--pg-uniform-*)` aliases

## 2) Standalone Areas (Edit Independently)
These are intentionally not tied to the cohesive card group:
- Page background: `body` / `--page-background`
- Main app title: `.app-title`, `#titleMain`, `#titleSub`
- Tagline: `.tagline`
- About button: `.about-heart-btn`
- Footer quote card: `footer`, `.motivational-quote`, `--footer-*`
- About modal title: `.about-title`

## 3) Functional Selector Dependencies
Do not rename these IDs/classes unless you also update `app.js`:
- `#task-input`, `#add-task-btn`, `#task-list`
- `#timerLaunchBtn`, `#timerTaskSelect`, `#focusHoursWheel`, `#focusMinutesWheel`, `#focusSecondsWheel`
- `#statCompletedTasks`, `#statTimerSessions`
- `#completedByTab`, `#completedTitle`
- `#openAboutBtn`, `#aboutOverlay`, `#resetConfirmOverlay`, `#prizeOverlay`

## 4) Safe Editing Workflow
1. Change only one token or section at a time.
2. Refresh and verify: Tasks, Timer, Stats, Completed card layout.
3. Verify interactions still work: Add task, start timer, complete task, open modals.
4. Commit in small checkpoints.

## 5) Bloat / Dead-Code Candidates (Review Before Deleting)
These appear potentially unused but should be confirmed before removal:
- `about.html` (currently empty)
- `taskCount` logic in `app.js` (no matching `#taskCount` element in `index.html`)
- `.timer-setup-subtitle` CSS class (not currently in `index.html`)
- `document.body.classList.add("pg-mode")` in `app.js` (no matching `.pg-mode` selectors in `styles.css`)
- `assets/fonts/*` files (no current `@font-face` or font-file references)
- `assets/textures/grime.png` (no current references)
- Debug/info `console.log` lines in API/audio sections of `app.js`
