DSIGDT (Dumb Shit I Gotta Do Today)

Project Description

DSIGDT is a daily productivity dashboard designed to make overwhelming tasks feel smaller and more doable. It is built with vanilla JavaScript, HTML, and CSS (no frameworks). The app includes a dual-mode design system with a punk/grunge “Shit Mode” and a cleaner “PG Mode.” It supports task and subtask tracking with visual feedback, a simple focus timer, progress stats, and small reward moments. Tasks and progress persist using localStorage so data remains after refresh or closing the browser.

Capstone Requirements and Features

This project includes a required non-weather API integration using the Bored API. It fetches activity suggestions to provide quick “break idea” prompts, and displays fallback text if the request fails. Task data is stored in arrays of objects and used to compute and display totals such as completed tasks and completed timer sessions. User input is validated to prevent empty or whitespace-only tasks and subtasks from being saved. Data persistence is handled through localStorage, which saves and reloads tasks, stats, and mode preferences automatically.

Technologies Used

HTML provides semantic structure, CSS handles layout with Flexbox, Grid, and media queries, and vanilla JavaScript manages DOM updates, event handling, fetch requests, and localStorage. Canvas is used for confetti-style reward effects.

Setup and Run Instructions

This project runs in any modern browser. Running it with the Live Server extension in VS Code is recommended for the smoothest experience. No API key is required for the core functionality.

AI Usage Disclosure

AI assistance was used for limited support such as debugging CSS layout issues and suggesting best practices for organizing localStorage code. All core logic, feature choices, and implementation decisions were completed by the developer.
