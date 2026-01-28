/* =====================================================
   HP Tabs Behavior + Task Rendering (MVP)
   Purpose:
   - Allow switching between task tabs
   - Enforce ONE active tab at a time
   - Render tasks per tab using static seed data
   - No persistence yet
   - No checkbox behavior yet

   IMPORTANT RULES:
   - Do NOT rename .tab or .tab--active without updating CSS
   - Do NOT change data-tab values without updating TASKS_BY_TAB keys
   - If you change the default active tab in HTML,
     update the initial render key at the bottom of DOMContentLoaded
===================================================== */

/* -------------------------------
   Static task seed data (MVP)
   Later this will come from state / localStorage
-------------------------------- */

const TASKS_BY_TAB = {
  dueToday: [
    "Email landlord",
    "Finish capstone work",
    "Take meds"
  ],
  soon: [
    "Clean kitchen",
    "Grocery run"
  ],
  asSoonAsICan: [
    "Organize closet",
    "Call dentist"
  ],
  dontForget: [
    "Buy cat food",
    "Pay credit card"
  ]
};

/* -------------------------------
   Render tasks for a given tab
-------------------------------- */

function renderTasks(tabKey) {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";

  const tasks = TASKS_BY_TAB[tabKey] || [];

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
  });
}

/* -------------------------------
   Tabs behavior + initial render
-------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active state from all tabs
      tabs.forEach((t) => {
        t.classList.remove("tab--active");
        t.removeAttribute("aria-current");
      });

      // Activate clicked tab
      tab.classList.add("tab--active");
      tab.setAttribute("aria-current", "page");

      // Render tasks for selected tab
      const selectedTab = tab.dataset.tab;
      renderTasks(selectedTab);
    });
  });

  // Initial render
  // IMPORTANT: If you change the default active tab in HTML,
  // update this key to match.
  renderTasks("dueToday");
});