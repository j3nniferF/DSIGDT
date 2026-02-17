Dumbit Feature Notes

Overview
Dumbit is a simple productivity app I built step by step. I added each feature one at a time, tested it, and kept the code organized so I can explain it.

Tab Navigation
Lets you switch between Tasks, Timer, and Stats.
Clicking a tab hides the other sections and shows the one you picked. The active tab gets a different style so it’s obvious.
How I tested
Clicked through tabs, checked only one view shows, tried different screen sizes and keyboard tabbing.

Task Management
Add tasks, mark them done, and delete them. Done tasks look different.
Tasks are stored in an array and rendered into the list. Each task has an id, text, and completed status. When you toggle or delete, the data updates and the UI re-renders.
How I tested
Added with button and Enter, toggled completion, deleted tasks, checked empty state, made sure blank input doesn’t add anything.

Focus Timer
A start/pause/reset countdown timer with preset buttons.
An interval counts down every second. The app tracks seconds left, formats it as mm:ss, and prevents multiple timers from running at once. When it hits zero, it triggers the completion behavior and resets.
How I tested
Start, pause, resume, reset, presets, and a full run to zero.

Rewards and Confetti
Confetti + a reward popup when you complete a task or finish a timer.
Confetti is a canvas animation that runs for a short time and then cleans itself up. App.js triggers it on completion events.
How I tested
Finished tasks/timers, confirmed it only triggers on completion (not un-do), and checked it doesn’t block clicking.

Local Storage
Saves tasks and stats so they survive refresh and browser restarts.
Data is saved as JSON in localStorage whenever something changes, and loaded back in on page load.
How I tested
Made changes, refreshed, reopened the browser, and checked localStorage in DevTools.

Stats
Shows totals for completed tasks and finished focus sessions.
Counters increment when you complete a task or a timer session. Stats display updates and saves with localStorage.
How I tested
Completed tasks and timers, checked counts update, refreshed to confirm they persist.
