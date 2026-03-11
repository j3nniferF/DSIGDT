    FIND KEY

♡♡♡♡♡♡♡♡
2.22 TO DO:

<!-- DONE -->
<!-- FIX1 = fonts -->
<!-- FIX2 = title -->
<!-- FIX3 = heading colors / input border colors / +add btn x/ checkbox -->
<!-- FIX4 = reminder popup timer -->

2/25
Tab rename ← next
Rainbow Reset modal
About modal
ALL STUFF tab
Edit tasks
Style pass — footer quote treatment, reminder popup rainbow, doughnut chart rainbow colors
Enhanced timer — task select, time's up modal, floating panel, +5 min
Per-tab completed breakdown

ABOUT
♡ ♥ Add stuff to your tabs, check it off when done
♡ ♥ Double-click a tab name to rename it
♡ ♥ Finish a whole tab → Goober appears 🐱
♡ ♥ Use the timer to stay focused
♡ ♥ Wellness reminders pop up to keep you human

btn bg from silly lighter...
background: linear-gradient(
135deg,
rgba(255, 107, 107, 0.22),
rgba(255, 217, 61, 0.22),
rgba(107, 255, 154, 0.22),
rgba(107, 180, 255, 0.22),
rgba(195, 107, 255, 0.22)
),
rgba(255, 255, 255, 0.9) !important;

darker...
background:
linear-gradient(
135deg,
rgba(255, 107, 107, 0.55),
rgba(255, 217, 61, 0.55),
rgba(107, 255, 154, 0.55),
rgba(107, 180, 255, 0.55),
rgba(195, 107, 255, 0.55)
),
rgba(255, 255, 255, 0.9) !important;
border: 2px solid transparent;
border: 5px solid transparent;

3.8
.task-card > h2::before
X background: rgba(255, 255, 255, 0.78);

        .tasks-card > h2

X font-size: clamp(1.4rem, 4.5vw, 2.4rem);

- font-size: clamp(2.4rem, 4.5vw, 3.7rem);

          h2

  X -webkit-text-stroke: 0.3px rgba(60, 0, 100, 0.4);

- -webkit-text-stroke: .4px;

          .tab-btn.active

  X background: rgba(255, 255, 255, 0.82);

- background: rgb(26 26 46 / 30%);

          .tab-btn

  X font-size: clamp(0.85rem, 2.8vw, 1.1rem);

- font-size: clamp(1.3rem, 2.8vw, 1.1rem);

<!-- Saturday's to do list: -->

# HTML

- reshape both views
- labels
- remove SVG
- swap Reset → Done!

# CSS

opacity fix

- slot machine boxes
  ♡ draining border (the cool conic-gradient trick!)

* modal sizing?

# JS

- fix drag
- wire Done!

* button for reset or X?
* swap SVG arc for gradient?

## ETC

- [heartbeat for timer pulse?]
  > (https://codepen.io/geoffgraham/pen/yLywVbW)

<!-- TO DOS: -->

Core Functionality
random tasks in task input and maybe PICK ME A RANDOM TASK! (both suggested tasks and from existing list)
Selected task state + dblclick task to open timer pre-selected
Completed section: per-tab summary cards with expand on click
completed with accordion
timer needs to ask if done or five minutes before reward
make timer full screen focus mode with task name
Timer: drum roller idle-state time picker (HTML + CSS + JS)
Timer standalone popup mode
welcome page / landing screen for the app
welcome/tutorial first-run behavior
-done confetti?
-⏱ TIMER

Stats / Tracking
donut → line chart
BIG 13/29 done! for ALL STUFF COMPLETED?
Stats tracking — dumbit_stats object never built, needed for chart improvement
-advanced sounds

Modals / Panels
Tab edit modal: needs CSS polish (fonts, button sizing, input styling)
About modal (button is in HTML, no modal yet)
Reset modal X button — “Nevermind!” still needs to become an X
About modal auto-close bug — it closes on its own sometimes
title / about / reset / sounds / reminders / etc??????

Style System / Consistency
cohesive styles
ALL BORDERS AND X AND TASK INPUT AND BUTTONS AND TITLES THE SAME
header title for all cards, buttons about reset etc
title for all cards?! format issues
header title hug, make tighter
tabs theme
tab input border around tabs and tabs rainbow bg behind cards
tab rainbow border for active tab
icons should be the color palette rainbow text from header title..pop? something
icon border colors for popup panels (example about = purple)
Footer quote: rainbow treatment
dark mode?
-button icon thing pop ups ,,, colorized gradient for title?

Branding / Title
slow shimmer title
add pink to title
something cool to use the title dumb stuff i gotta do today drawing?
-welcome page

Animations
icon shake animation
tab active animation
border animation
border animations standardized across components
animation borders and other animations for tabs and stuff
ANIMISTA CARD FEATURES POPS AND SHIT
text tracking out completed cards
text popups for tabs
confetti
other animations from prebake
swing animation for tab cards when switching tabs
heartbeat animation for timer numbers

Input / UX Improvements
input suggestions
reminders popup edits suggestions or add ins?
-task sugesstions

        <!-- 2.9 -->

DO NEXT (in order)

Footer quote — rainbow text treatment
Chart.js + stats tracking
Tab edit modal CSS polish
About modal polish
All popups/modals cohesive styling pass
Timer bugs

Conic drain triangle visible behind modal
Card titles weird/hard to read in running view
No Reset button during running state
Close X conflicts with drag cursor
Timer numbers need to be bigger
No confetti after Done!
Full-screen focus mode
"Done or 5 more minutes?" before reward
Active bugs

Reset modal: "Nevermind!" → X button
About modal auto-close bug
Footer quote rainbow styling
Reminders banner style + UX
Delete test-tabs.html
Wishlist (after required stuff)

Stats: dumbit stats "BIG 13/29 DONE!" banner
Random task + "PICK ME A RANDOM TASK!" button
Dblclick task → opens timer pre-selected
Timer: standalone popup, full-screen focus mode, drum roller
Done! confetti
Welcome/first-run screen
Cohesive style system (borders, buttons, titles, icons, modals)
Colorized gradient titles per modal
Mobile layout restyling pass
Animations: icon shake, tab swing, card pops, text tracking-out, heartbeat timer, border animations
Slow shimmer + pink on h1 title
Advanced sounds, dark mode
