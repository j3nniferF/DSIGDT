# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## About This Project

**"Dumb Stuff I Gotta Do Today" (DSIGDT)** is a personal productivity web app built as a capstone project for a web dev coding class.

This is a **fresh rebuild** of an earlier version (now saved as `DSIGDT-prebake` on GitHub). The goal is for the student to build and understand every line themselves, with step-by-step guidance. The prebake repo serves as a reference and inspiration only.

**Due date: Friday, April 10, 2026 at noon. No extensions.**

---

## How We Work Together

- **Go step by step.** Explain the "why" behind every decision, not just the "what."
- **Student drives.** They type the code. Claude walks them through it.
- **No jargon without explanation.** Define technical terms when introducing them.
- **Check for understanding** before moving on.
- **The student needs to be able to explain and defend all code choices** — this is a graded capstone project.
- Student has ADHD/autism and learns well by seeing the big picture first, then filling in details.
- Student is enthusiastic, detail-oriented, and cares deeply about this project. Match that energy!

---

## Capstone Requirements to Track

### Required
- [ ] **Responsive design** — media queries, CSS Grid, Flexbox, components adapt to mobile + desktop
- [ ] **Feature 1** — Use arrays, objects, sets, or maps to store and retrieve data displayed in the app
- [ ] **Feature 2** — Visualize data in a user-friendly way (charts/graphs — plan to use Chart.js)
- [ ] **Feature 3** — Retrieve data from a third-party API and display it in the app
- [ ] **Node.js + Express server** — serve the app, implement at least one route
- [ ] **README.md** — project overview, setup instructions, usage, API details

### Planned Optional Features (strengthen the project)
- [ ] Data persistence beyond localStorage (external API or SQLite)
- [ ] Form for user input that ties to data retrieval

### Documentation
- [ ] Code comments throughout
- [ ] README.md complete before submission

---

## Planned Features

### Core (rebuilding from prebake)
- Task management with customizable tabs
- Pomodoro-style focus timer
- Mini calendar tracking task completions by day
- Reward modal (confetti + GIF) on task/timer completion
- Motivational quote in footer (from API)

### New Features (not in prebake)
- **Wellness reminder system** — timed popups the user can customize (e.g., "unclench your jaw!", "drink water!"). Configurable interval and message list. Stored as objects/arrays in localStorage.
- **Chart.js data visualization** — visual charts for task completion stats (strengthens Feature 2)

---

## Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Structure | HTML | foundation |
| Styling | CSS (Flexbox, Grid, media queries) | responsive design requirement |
| Logic | Vanilla JavaScript | what student knows and is learning |
| Server | Node.js + Express | capstone requirement |
| Charts | Chart.js | data visualization requirement |
| GIFs | GIPHY API | reward modal, already familiar |
| Quotes | affirmations.dev | motivational footer, already familiar |
| Data | localStorage (+ optional external API) | persistence |

---

## Architecture Notes (from prebake reference)

### Script loading order matters
1. `confetti.js` — defines global `confetti` instance
2. `config.js` — defines global `CONFIG` (API keys, customizable text)
3. `app.js` — all app logic, reads CONFIG at startup

### localStorage keys used in prebake (reuse or adapt)
- `dsigdt_tasks` — task array (JSON)
- `dsigdt_tabs` — tab array (JSON)
- `dsigdt_active_tab` — active tab ID string
- `dumbit_stats` — `{ completedTasks, timerSessions, completionByDate }`

### Modal pattern
All modals are hidden with `.is-hidden` CSS class. Show = remove `.is-hidden`. Hide = add it back.

### Tab system
- Default tabs: `{ id: "tab_dumb", name: "DUMB STUFF" }` and `{ id: "tab_other", name: "OTHER STUFF" }`
- New tabs: `id: "tab_${Date.now()}"`
- Special "all tasks" tab ID: `"__all_tasks__"`

### Confetti
Custom canvas-based `ConfettiGenerator` class in `confetti.js`. Called via `confetti.celebrate(duration, colors)`.

### External APIs
- `https://www.affirmations.dev/` — motivational quote
- `https://uselessfacts.jsph.pl/api/v2/facts/random` — fun fact fallback
- `https://api.giphy.com/v1/gifs/search` — reward GIF (needs API key in config)

---

## Project Status

Currently: **planning phase, about to start fresh build**

Next steps:
1. Rename old repo on GitHub ✅ (now called `DSIGDT-prebake`)
2. Create new `DSIGDT` repo
3. Set up Node.js + Express server as the foundation
4. Build HTML structure
5. Add CSS (responsive)
6. Add JavaScript features one at a time
7. Add Chart.js visualization
8. Add wellness reminder feature
9. Write README.md
10. Final review against all requirements
