/* =====================================================
   HP Tabs + Tasks (MVP v3.2 - LOCALSTORAGE + GROUPED COMPLETED + FOCUS PICKER)
   - Tabs: per-tab tasks
   - Checkbox: marks complete (stored per tab)
   - Completed card: grouped by tab
   - Focus picker: choose "ALL" or one tab, then choose task
   - Click a task row: selects it in the focus dropdown
===================================================== */

const STORAGE_KEY = "dsigdt_state_v1";

const TAB_ORDER = ["dueToday", "soon", "asSoonAsICan", "dontForget"];

const TAB_LABELS = {
  dueToday: "DUE TODAY",
  soon: "SOON",
  asSoonAsICan: "AS SOON AS I CAN",
  dontForget: "DON’T FORGET",
};

let TASKS_BY_TAB = {
  dueToday: ["Email landlord", "Finish capstone work", "Take meds"],
  soon: ["Clean kitchen", "Grocery run"],
  asSoonAsICan: ["Organize closet", "Call dentist"],
  dontForget: ["Buy cat food", "Pay credit card"],
};

let COMPLETED_TASKS = {
  dueToday: [],
  soon: [],
  asSoonAsICan: [],
  dontForget: [],
};

let activeTabKey = "dueToday";

/* Focus UI state */
let focusScope = "all"; // "all" or a tabKey
let selectedFocusValue = ""; // `${tabKey}::${taskText}`

/* -------------------------------
   Persistence
-------------------------------- */
function normalizeState() {
  // Ensure all tab keys exist and are arrays
  TAB_ORDER.forEach((k) => {
    if (!Array.isArray(TASKS_BY_TAB[k])) TASKS_BY_TAB[k] = [];
    if (!Array.isArray(COMPLETED_TASKS[k])) COMPLETED_TASKS[k] = [];
  });

  if (!TAB_ORDER.includes(activeTabKey)) activeTabKey = "dueToday";
  if (focusScope !== "all" && !TAB_ORDER.includes(focusScope)) focusScope = "all";
  if (typeof selectedFocusValue !== "string") selectedFocusValue = "";
}

function saveState() {
  const state = {
    tasksByTab: TASKS_BY_TAB,
    completedByTab: COMPLETED_TASKS,
    activeTabKey,
    focusScope,
    selectedFocusValue,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);

    if (parsed.tasksByTab && typeof parsed.tasksByTab === "object") {
      TASKS_BY_TAB = parsed.tasksByTab;
    }

    if (parsed.completedByTab && typeof parsed.completedByTab === "object") {
      COMPLETED_TASKS = parsed.completedByTab;
    }

    if (typeof parsed.activeTabKey === "string") {
      activeTabKey = parsed.activeTabKey;
    }

    if (typeof parsed.focusScope === "string") {
      focusScope = parsed.focusScope;
    }

    if (typeof parsed.selectedFocusValue === "string") {
      selectedFocusValue = parsed.selectedFocusValue;
    }

    normalizeState();
  } catch (err) {
    console.warn("Saved state corrupted; using defaults.", err);
    normalizeState();
  }
}

/* -------------------------------
   Helpers
-------------------------------- */
function makeTaskValue(tabKey, taskText) {
  return `${tabKey}::${taskText}`;
}

function parseTaskValue(value) {
  const [tabKey, ...rest] = value.split("::");
  return { tabKey, taskText: rest.join("::") };
}

function getIncompleteTasks(tabKey) {
  const all = TASKS_BY_TAB[tabKey] || [];
  const done = COMPLETED_TASKS[tabKey] || [];
  return all.filter((t) => !done.includes(t));
}

/* -------------------------------
   UI sync
-------------------------------- */
function syncHeadings(tabKey) {
  const tasksHeading = document.getElementById("tasksHeading");
  const label = TAB_LABELS[tabKey] || tabKey;
  if (tasksHeading) tasksHeading.textContent = `${label}:`;
}

function syncActiveTabUI(tabsNodeList, tabKey) {
  tabsNodeList.forEach((t) => {
    const isActive = t.dataset.tab === tabKey;
    t.classList.toggle("tab--active", isActive);
    if (isActive) t.setAttribute("aria-current", "page");
    else t.removeAttribute("aria-current");
  });
}

function updateProgress() {
  const progressText = document.getElementById("progressText");
  if (!progressText) return;

  let total = 0;
  let done = 0;

  TAB_ORDER.forEach((tabKey) => {
    const all = TASKS_BY_TAB[tabKey] || [];
    const completed = COMPLETED_TASKS[tabKey] || [];
    total += all.length;
    done += completed.length;
  });

  progressText.textContent = `${done} / ${total} TASKS DONE`;
}

/* -------------------------------
   Tasks render
-------------------------------- */
function setSelectedFocus(value) {
  selectedFocusValue = value;

  const focusSelect = document.getElementById("focusSelect");
  if (focusSelect) {
    const exists = Array.from(focusSelect.options).some((o) => o.value === value);
    focusSelect.value = exists ? value : "";
  }

  renderTasks(activeTabKey);
  saveState();
}

function renderTasks(tabKey) {
  const taskList = document.getElementById("taskList");
  if (!taskList) return;

  taskList.innerHTML = "";

  const remaining = getIncompleteTasks(tabKey);

  remaining.forEach((taskText) => {
    const value = makeTaskValue(tabKey, taskText);

    const li = document.createElement("li");
    li.className = "task";
    if (value === selectedFocusValue) li.classList.add("task--selected");

    li.innerHTML = `
      <label class="task-row">
        <input class="task-checkbox" type="checkbox" />
        <span class="task-text"></span>
      </label>
    `;

    li.querySelector(".task-text").textContent = taskText;
    taskList.appendChild(li);

    // Clicking the row selects it for the timer dropdown
    li.addEventListener("click", () => {
      // Ensure focusScope includes the task (if user is scoped to a different tab)
      const focusTabSelect = document.getElementById("focusTabSelect");
      if (focusTabSelect && focusScope !== "all" && focusScope !== tabKey) {
        focusScope = "all";
        focusTabSelect.value = "all";
        buildFocusSelect(); // rebuild first so option exists
      }

      buildFocusSelect(value);
      setSelectedFocus(value);
    });

    const checkbox = li.querySelector(".task-checkbox");
    checkbox.addEventListener("change", (e) => {
      if (!e.target.checked) return;

      if (!COMPLETED_TASKS[tabKey]) COMPLETED_TASKS[tabKey] = [];
      if (!COMPLETED_TASKS[tabKey].includes(taskText)) {
        COMPLETED_TASKS[tabKey].push(taskText);
      }

      // If the completed item was selected for focus, clear selection
      if (selectedFocusValue === value) selectedFocusValue = "";

      saveState();

      renderTasks(tabKey);
      renderCompletedGrouped();
      buildFocusSelect(); // remove completed from options
      updateProgress();
    });
  });
}

/* -------------------------------
   Completed render (GROUPED BY TAB)
-------------------------------- */
function renderCompletedGrouped() {
  const groups = document.getElementById("completedGroups"); // ✅ matches index.html
  if (!groups) return;

  groups.innerHTML = "";

  TAB_ORDER.forEach((tabKey) => {
    const done = COMPLETED_TASKS[tabKey] || [];
    if (done.length === 0) return;

    const section = document.createElement("section");
    section.className = "completed-group";

    const h3 = document.createElement("h3");
    h3.className = "completed-subheading";
    h3.textContent = TAB_LABELS[tabKey] || tabKey;

    const ul = document.createElement("ul");
    ul.className = "completed-list";

    done.forEach((taskText) => {
      const li = document.createElement("li");
      li.textContent = taskText;
      ul.appendChild(li);
    });

    section.appendChild(h3);
    section.appendChild(ul);
    groups.appendChild(section);
  });
}

/* -------------------------------
   Focus dropdown builder
   - Uses focusScope:
     - "all" => optgroups per tab
     - tabKey => only that tab's tasks
   - Optionally sets selection (auto-select new task, or clicked task)
-------------------------------- */
function buildFocusSelect(valueToSelect) {
  const focusSelect = document.getElementById("focusSelect");
  const focusTabSelect = document.getElementById("focusTabSelect");
  if (!focusSelect) return;

  const previous = valueToSelect ?? selectedFocusValue ?? focusSelect.value;

  // Sync UI dropdown with state
  if (focusTabSelect) focusTabSelect.value = focusScope;

  focusSelect.innerHTML = "";
  const base = document.createElement("option");
  base.value = "";
  base.textContent = "(Pick a task)";
  focusSelect.appendChild(base);

  const addTaskOption = (tabKey, taskText, parent) => {
    const opt = document.createElement("option");
    opt.value = makeTaskValue(tabKey, taskText);
    opt.textContent = taskText;
    parent.appendChild(opt);
  };

  if (focusScope === "all") {
    TAB_ORDER.forEach((tabKey) => {
      const tasks = getIncompleteTasks(tabKey);
      if (tasks.length === 0) return;

      const og = document.createElement("optgroup");
      og.label = TAB_LABELS[tabKey] || tabKey;

      tasks.forEach((taskText) => addTaskOption(tabKey, taskText, og));
      focusSelect.appendChild(og);
    });
  } else {
    const tasks = getIncompleteTasks(focusScope);
    tasks.forEach((taskText) => addTaskOption(focusScope, taskText, focusSelect));
  }

  const exists = Array.from(focusSelect.options).some((o) => o.value === previous);
  focusSelect.value = exists ? previous : "";
  selectedFocusValue = exists ? previous : "";
}

/* -------------------------------
   Wiring
-------------------------------- */
function wireAddTaskForm() {
  const form = document.getElementById("taskAddForm");
  const input = document.getElementById("taskInput");
  const error = document.getElementById("taskError");

  if (!form || !input) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const raw = input.value.trim();
    if (!raw) {
      if (error) error.textContent = "Type something first.";
      return;
    }
    if (error) error.textContent = "";

    if (!TASKS_BY_TAB[activeTabKey]) TASKS_BY_TAB[activeTabKey] = [];

    // prevent duplicates in same tab
    if (!TASKS_BY_TAB[activeTabKey].includes(raw)) {
      TASKS_BY_TAB[activeTabKey].push(raw);
    }

    // Make focus scope follow the active tab (feels natural)
    const focusTabSelect = document.getElementById("focusTabSelect");
    if (focusTabSelect) {
      focusScope = activeTabKey;
      focusTabSelect.value = activeTabKey;
    }

    const newValue = makeTaskValue(activeTabKey, raw);
    selectedFocusValue = newValue;

    saveState();

    renderTasks(activeTabKey);
    renderCompletedGrouped();
    buildFocusSelect(newValue);
    updateProgress();

    input.value = "";
    input.focus();
  });
}

function wireFocusPickers() {
  const focusTabSelect = document.getElementById("focusTabSelect");
  const focusSelect = document.getElementById("focusSelect");

  if (focusTabSelect) {
    focusTabSelect.addEventListener("change", () => {
      focusScope = focusTabSelect.value;
      buildFocusSelect();
      saveState();
    });
  }

  if (focusSelect) {
    focusSelect.addEventListener("change", () => {
      selectedFocusValue = focusSelect.value || "";
      renderTasks(activeTabKey); // update highlight if it’s in this tab
      saveState();
    });
  }
}

/* -------------------------------
   Boot
-------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab");

  loadState();
  normalizeState();

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activeTabKey = tab.dataset.tab;

      // When switching tabs, set focus list to that tab (your readability request)
      const focusTabSelect = document.getElementById("focusTabSelect");
      if (focusTabSelect) {
        focusScope = activeTabKey;
        focusTabSelect.value = activeTabKey;
      }

      syncActiveTabUI(tabs, activeTabKey);
      syncHeadings(activeTabKey);

      renderTasks(activeTabKey);
      renderCompletedGrouped();
      buildFocusSelect();
      updateProgress();

      saveState();
    });
  });

  wireAddTaskForm();
  wireFocusPickers();

  // Initial paint
  const focusTabSelect = document.getElementById("focusTabSelect");
  if (focusTabSelect) focusTabSelect.value = focusScope;

  syncActiveTabUI(tabs, activeTabKey);
  syncHeadings(activeTabKey);

  renderTasks(activeTabKey);
  renderCompletedGrouped();
  buildFocusSelect(selectedFocusValue);
  updateProgress();
});