### DSIGDT — Dumb Stuff I Gotta Do Today

DSIGDT is a daily productivity dashboard designed to make overwhelming tasks feel smaller, more visual, and easier to manage.
The application was built using HTML, CSS, JavaScript, and Node.js with Express, and focuses on interactive UI, state-based rendering, and persistent user data.

## Features

Add, complete, and delete tasks
Tab-based task organization (tasks assigned to specific categories)
One active task can be selected and sent to the timer
Custom timer with setup and running states
SVG-based countdown dial that visually drains as time passes
“Time’s Up” modal with task completion flow
Progress tracking with Chart.js (completed vs remaining tasks)
Motivational quote fetched from an external API
Data persistence using localStorage (tasks, tabs, active tab)
Responsive design using Flexbox and media queries

## Additional Features:

Customizable wellness reminder popups with rotating messages and adjustable intervals
“Got Done” flip card section showing completed tasks organized by tab
Reward modal with confetti animation when all tasks in a tab are completed

## Requirements Implemented

This project includes the following required concepts:
Arrays & Objects
Tasks and tabs are stored as objects inside arrays and manipulated throughout the app
Functions
Reusable functions such as:
renderTasks() — updates UI based on current state
toggleTask() — handles completion logic
startCountdown() — manages timer behavior
resetTimer() — shared reset logic (DRY principle)
Event Handling
Click, input, and timer-based events are used throughout the app
Local Storage
Tasks stored under dsigdt_tasks
Tabs stored under dsigdt_tabs
Active tab stored under dsigdt_active_tab
Data persists across refresh and browser sessions
Chart / Data Visualization
Chart.js is used to display task completion progress
External API (Non-Weather)
affirmations.dev API is used to fetch motivational quotes
Responsive Design
Media queries and flexible layouts ensure usability across screen sizes

## Tech Stack

HTML — semantic structure
CSS — Flexbox, animations, media queries
JavaScript — DOM manipulation, state management, events, localStorage
Node.js + Express — server and API proxy
Chart.js — data visualization
affirmations.dev API — external data source

Setup Instructions 1. Clone the repository 2. Run npm install 3. Run npm run dev 4. Open http://localhost:4000 in your browser
API Used
affirmations.dev
Endpoint: https://www.affirmations.dev/
No API key required
Fetch occurs on page load
Fallback message is used if request fails
CORS Solution:
A server-side Express route is used as a proxy to fetch data, avoiding browser CORS restrictions.

## 1. Timer System and State Management

The timer required multiple UI states (setup vs running) and coordination between JavaScript logic and CSS.
Solved by implementing state-based rendering using classes (is-setup, is-running)
Reduced complexity by toggling one parent class instead of many elements
Extracted reusable logic into functions (DRY principle)

2. Synchronizing Visuals with Logic (SVG Dial)
   The countdown dial required mapping time values to a visual representation.
   Used stroke-dasharray and stroke-dashoffset to animate the circle
   Calculated progress using remaining time ÷ total time → converted to visual offset

3. CSS Complexity and Rendering Behavior
   Styling required solving conflicts between multiple advanced CSS features.
   Learned that transform properties override each other and must be combined
   Resolved conflicts between gradient text and gradient borders by separating elements
   Used opacity instead of display: none to allow smooth transitions
   Explored modern CSS features like @property for animated gradients

4. Data Handling and Type Issues
   Task IDs and DOM values caused mismatches due to type differences.
   Solved using parseInt() to ensure correct comparisons

5. CSS Animations and Visual Effects
   The visual design required learning several advanced CSS techniques from scratch.
   At first, @property --angle felt completely fake — like CSS wasn’t supposed to be able to animate something like a gradient direction. Realizing you could “teach” the browser what kind of variable it was so it could animate blew my mind a little.
   The gradient text + gradient border problem kept breaking in really frustrating ways. Every time I got the text looking right, the border disappeared, and when I fixed the border, the text broke again. It took a while to understand that both were fighting over the same background property and needed to be split into separate elements.
   Transforms were another thing that kept messing me up. I had elements centered with translate(-50%, -50%), and the second I added scale(), everything jumped out of place. It didn’t make sense at first until I realized transforms don’t stack automatically — they overwrite each other unless you combine them.
   A lot of this came down to trial and error, reading MDN docs until my eyes crossed, and eventually understanding why something broke instead of just patching it and moving on.

## AI Usage Disclosure

AI was used as a learning tool only.
The CLAUDE.md file contained specific written instructions not to write code, only to explain and guide. All code was typed by hand.
AI was used to explain concepts, debug issues, and help break down complex problems. No full solutions were copied or pasted. All fonts were chosen, all rainbows painted, all tears cried, and all the tough stuff figured out by me.

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
4. Open `http://localhost:3000` in browser

# API Used

- affirmations.dev — fetches a random affirmation on page load.
- Endpoint: `https://www.affirmations.dev/`
- No API key required.
- Falls back to a hardcoded message if fail.

# AI Usage Disclosure

AI assistance was used for debug errors and assistence implementating advanced features. The goal was to enhanse current knowledge with minimal assistance. All code was typed, fonts chosen, rainbows painted, tears cried and tough stuff created by hand!
