# DSIGDT — Dumb Stuff I Gotta Do Today

DSIGDT is a daily productivity dashboard designed to make all the overwhelming stuff feel smaller and more doable.
It's built with JavaScript, HTML, CSS, and lots of love, tears and coffee.

# What It Does

- Add, complete, and delete tasks
- Live progress chart showing completed vs. remaining tasks (Chart.js)
- Wellness reminder popups on a timer with rotating messages
- Motivational quote in the footer from the affirmations.dev API
- All task data persists in localStorage and stays after refresh or closing the browser

# Tech Stack

- HTML — semantic structure
- CSS — Flexbox, media queries, responsive layout
- JavaScript — DOM updates, event handling, fetch, localStorage
- Node.js + Express — serves the app, using an API route
- Chart.js — data visualization (progress chart)
- affirmations.dev API — motivational quotes

# Setup

1. Clone the repo
2. Run `npm install`
3. Run `npm run dev` to start the server
4. Open `http://localhost:4000` in browser

# API Used

- affirmations.dev — fetches a random affirmation on page load.
- Endpoint: `https://www.affirmations.dev/`
- No API key required.
- Falls back to a hardcoded message if fail.

# AI Usage Disclosure

AI was used as a learning tool only to explain concepts, debug issues, and help break down complex problems. No full solutions were copied or pasted. The CLAUDE.md file contained specific written instructions not to write code, only to explain and guide.
All code written, fonts chosen, rainbows painted, tears cried, and all the tough stuff figured out by me!
