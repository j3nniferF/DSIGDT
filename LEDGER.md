# DSIGDT — Build Notes

## General

styling took way longer than expected
fonts + gradients + webkit stuff = days of messing around
fun but also easy to get stuck in and lose time
timer is not simple at all
kept thinking it was "just a timer" but it turned into a whole system

## TIMER

started writing timer styles and realized a bunch of things were missing
drum picker needs its own structure
dial needs svg + animation
text needs to be centered inside a circle
a lot of css classes didn't exist yet
decided not to patch things one by one
better to build the full structure and styles together so it all lines up
renamed .timer-panel h3 → .timer-drag-handle
old version styled any h3 inside timer panel
new version targets exactly what i want
more intentional and easier to reuse
**drag behavior**
cursor: grab on hover
cursor: grabbing on click
user-select: none so text doesn't highlight when dragging
without that it feels broken
**big issue with transforms**
.timer-display was centered using
transform: translate(-50%, -50%)
then animation added
transform: scale(1)
scale replaced translate completely
text jumped out of the center
fix was combining them
transform: translate(-50%, -50%) scale(1)
important: transforms overwrite each other unless combined
**text-shadow stopped working**
reason:
text is transparent because of gradient text
text-shadow follows text color
transparent text = invisible shadow
fix:
use filter: drop-shadow instead
drop-shadow applies to rendered element, not text color
**SVG dial logic**
stroke-dasharray = full circumference (~314)
stroke-dashoffset controls how much of the circle is hidden
js updates it like this:
..js
dialProgress.style.strokeDashoffset =
314 \* (1 - timerSeconds / totalTimerSeconds)..
timerSeconds / totalTimerSeconds = percent remaining
1 - that = percent used
start → 0 → full circle
half → 157 → half gone
end → 314 → empty
this is what makes the circle "drain"
**class handling**
using classList.add instead of className
className replaces everything
classList lets me add/remove specific classes without breaking others
**visibility issue**
was using display: none to hide/show parts of the timer
problem:
no animation, just snaps
also removes element from layout
switched to opacity instead
opacity: 0 = invisible but still exists
opacity: 1 = visible
added pointer-events: none when hidden so it doesn't block clicks
this allows fade transitions and keeps layout stable
**layout math for drum picker**
needed to fit inside circle
circle inner diameter ~153px
columns ~44px each with gap
3 visible items per column
numbers had to be adjusted specifically for the circle, not a normal layout
**alignment issue with separator**
flex center aligned it wrong
it was centering with full column wrapper including label
needed it centered on the actual column
solution:
align-items: flex-start
then manually offset separator with margin-top
calculated based on column height vs text height
**state-based rendering (major refactor)**
before:
js manually hiding/showing a bunch of elements
after:
use state classes on parent
timer-panel.is-setup
timer-panel.is-running
css handles what is visible
much cleaner and easier to debug
**flow**
start → switch to is-running
timer hits 0 → show times up modal
reset → back to is-setup
**DRY issue**
reset logic duplicated in multiple places
pulled into one resetTimer function
same with countdown
startCountdown used in more than one place
**selected task problem**
need to remember which task is tied to timer
stored selectedTimerTaskId outside functions so multiple parts can access it
**type issue**
select values are strings
task ids are numbers
comparison was failing silently
fix:
parseInt before comparing
**confetti bug**
when timer used without selecting a task
no confetti triggered
reason:
logic only fired when selectedTimerTaskId existed
fix:
add separate confetti trigger for free timer case

## TABS

initial thought: tasks are just one list
problem: everything is a mess
tabs needed for grouping
tasks get tabId
activeTabId tracks current tab
renderTasks filters based on active tab
**localStorage keys**
dsigdt_tabs
dsigdt_active_tab
**rendering tabs**
buttons created dynamically
click updates activeTabId
save + re-render
**gradient border vs gradient text problem**
both use background property
cannot exist on same element without conflict
this is why borders kept disappearing
fix:
wrap text in span
button handles border/background
span handles gradient text
separate responsibilities
**@property --angle**
did not expect css to be able to animate something like gradient direction
registering it as an angle makes it animatable
then animate from 0deg to 360deg
gradient appears to spin

## BROWSER / SERVER

**CORS issue**
browser blocks request to external api from localhost
solution:
express proxy route
browser → local server
server → api
avoids cors restrictions completely

## SMALL BUGS

**double click on tab sometimes didn't fire**
reason:
text selection event interferes
fix:
user-select: none on tab buttons

## General Note

a lot of this was breaking things, checking devtools, reading docs, and then realizing the actual reason something failed instead of just patching it
