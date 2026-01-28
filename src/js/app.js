/* =====================================================
   HP Tabs + Tasks (MVP v2)
   Purpose:
   - Allow switching between task tabs
   - Enforce ONE active tab at a time (visual + aria-current)
   - Render tasks per tab from static seed data
   - When a task is checked, move it to "SHIT I DID" (in-memory only)

   NOT YET:
   - No localStorage (refresh resets)
   - No uncheck-to-undo
   - No progress counts
   - No reward modal triggers

   IMPORTANT RULES (future-proofing):
   - Do NOT rename .tab or .tab--active without updating CSS
   - Do NOT change data-tab values without updating TASK KEYS below
   - If you change the default active tab in HTML,
     update activeTabKey's default AND the initial aria-current/tab--active in index.html
===================================================== */

/* -------------------------------
   Static task seed data (MVP)
   Later this will come from state/localStorage.
   If you rename a tab key here, you MUST also update:
   - the HTML: data-tab="..."
   - COMPLETED_TASKS keys
-------------------------------- */

const TASKS_BY_TAB = {
  dueToday: ["Email landlord", "Finish capstone work", "Take meds"],
  soon: ["Clean kitchen", "Grocery run"],
  asSoonAsICan: ["Organize closet", "Call dentist"],
  dontForget: ["Buy cat food", "Pay credit card"]
};

/* -------------------------------
   Completed tasks (in-memory)
   This is the "state" for what you've finished per tab.
   Later we will persist this (localStorage).
-------------------------------- */

const COMPLETED_TASKS = {
  dueToday: [],
  soon: [],
  asSoonAsICan: [],
  dontForget: []
};

/* -------------------------------
   Active tab state
   IMPORTANT:
   - Must match the default active tab in HTML (tab--active + aria-current).
   - Must match a key in TASKS_BY_TAB.
-------------------------------- */

let activeTabKey = "dueToday";

/* -------------------------------
   Render tasks for a given tab
   Behavior:
   - Shows only tasks NOT yet completed
   - Attaches checkbox handler:
       check -> move to COMPLETED_TASKS -> re-render both lists
-------------------------------- */

function renderTasks(tabKey) {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";

  // Filter out tasks that are already completed for this tab
  const tasks = (TASKS_BY_TAB[tabKey] || []).filter(
    (t) => !COMPLETED_TASKS[tabKey].includes(t)
  );

  tasks.forEach((taskText) => {
    const li = document.createElement("li");
    li.className = "task";

    li.innerHTML = `
      <label class="task-row">
        <input class="task-checkbox" type="checkbox" />
        <span class="task-text">${taskText}</span>
      </label>
    `;

    taskList.appendChild(li);

    // Checkbox behavior (MVP):
    // - Only responds when checked (no undo yet)
    // - Moves task into completed state for this tab
    const checkbox = li.querySelector(".task-checkbox");
    checkbox.addEventListener("change", (e) => {
      if (!e.target.checked) return;

      // Move task to completed list for this tab
      COMPLETED_TASKS[tabKey].push(taskText);

      // Re-render both lists so UI reflects state
      renderTasks(tabKey);
      renderCompleted(tabKey);
    });
  });
}

/* -------------------------------
   Render completed tasks for a given tab
   IMPORTANT:
   - index.html must contain ONE element with id="completedList"
   - If you change that id in HTML, update it here too
-------------------------------- */

function renderCompleted(tabKey) {
  const completedList = document.getElementById("completedList");
  completedList.innerHTML = "";

  const done = COMPLETED_TASKS[tabKey] || [];

  done.forEach((taskText) => {
    const li = document.createElement("li");
    li.textContent = taskText;
    completedList.appendChild(li);
  });
}

/* -------------------------------
   Tabs behavior + initial render
   Behavior:
   - Click tab -> remove active from all -> set active on clicked
   - Update aria-current="page" so assistive tech knows current tab
   - Update activeTabKey state
   - Re-render tasks + completed for that tab
-------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active state from all tabs (visual + accessibility)
      tabs.forEach((t) => {
        t.classList.remove("tab--active");
        t.removeAttribute("aria-current");
      });

      // Activate clicked tab
      tab.classList.add("tab--active");
      tab.setAttribute("aria-current", "page");

      // Update active tab state (must match TASKS_BY_TAB keys)
      const selectedTab = tab.dataset.tab;
      activeTabKey = selectedTab;

      // Render lists for current tab
      renderTasks(activeTabKey);
      renderCompleted(activeTabKey);
    });
  });

  // Initial render:
  // If you change the default active tab in HTML, update activeTabKey above too.
  renderTasks(activeTabKey);
  renderCompleted(activeTabKey);
});