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
- `--group-card-border-width`
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
- Modal shell (all popups): `--modal-*`
- About popup shell: `--about-modal-*`
- About popup feature cards: `--about-feature-*`
- About modal title: `.about-title`

Global typography lock:

- `styles.css` enforces Helvetica Neue thin for all text via:
  `body, body *, body *::before, body *::after`
- Default weight is controlled by `--font-weight-default` in `:root`.
- Per-area overrides (easy to edit):
  - `--font-weight-section-title`
  - `--font-weight-timer-setup-title` (controls “Select Task” / “Set Your Time”)
  - `--font-weight-button`

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

Quick guide:

- Speed: change duration in `.app-title`  
  `animation: titleRainbowShift 9s ease-in-out infinite;`  
  Example: `6s` faster, `14s` slower.
- Direction/intensity: change the keyframe background positions in `@keyframes titleRainbowShift`.
- Pause/remove: in `.app-title`, set `animation: none;`.

**titleRainbowShift animation**
Right now those controls are **not tokenized yet**, so edit them directly here:

1. **Speed/easing/repeat**  
   `styles.css:199`

```css
animation: titleRainbowShift 9s ease-in-out infinite;
```

- `9s` = speed
- `ease-in-out` = feel
- `infinite` = loop forever

2. **How far the gradient moves**  
   `styles.css:339` in `@keyframes titleRainbowShift`

- `0%`/`100%` are start/end
- `50%` is midpoint  
  Example: change `100% 50%` to `60% 50%` for subtler movement.

3. **Turn it off**  
   At `styles.css:199`, set:

```css
animation: none;
```
