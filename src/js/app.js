/* =====================================================
   HP Tabs + Tasks (MVP v3.1 - LOCALSTORAGE + GROUPED COMPLETED + FOCUS SELECT)
   Fixes:
   - ONE storage key (no duplicates)
   - Add task goes to ACTIVE TAB (not always dueToday)
   - Completed list grouped by tab
   - Timer dropdown grouped by tab (labels not selectable)
   - Clicking a task sets it as the “focus” task
   - Adding a task auto-selects it in the focus dropdown

   Assumes HTML has:
   - .tab elements with data-tab="dueToday|soon|asSoonAsICan|dontForget"
   - #taskList (UL)
   - #completedList (UL)
   - #tasksHeading (H3 or similar)
   - #taskInput (input)
   - #addTaskBtn (button)
   - #focusSelect (select)
===================================================== */

/* -------------------------------
   DOM HOOKS (change IDs here if yours differ)
-------------------------------- */
const elTaskList = document.getElementById("taskList");
const elCompletedList = document.getElementById("completedList");
const elTasksHeading = document.getElementById("tasksHeading");

const elTaskInput = document.getElementById("taskInput");
const elAddTaskBtn = document.getElementById("addTaskBtn");

const elFocusSelect = document.getElementById("focusSelect");

/* -------------------------------
   STORAGE
-------------------------------- */
const STORAGE_KEY = "dsigt_state_v1";

/* -------------------------------
   TAB LABELS
-------------------------------- */
const TAB_LABELS = {
  dueToday: "DUE TODAY",
  soon: "SOON",
  asSoonAsICan: "AS SOON AS I CAN",
  dontForget: "DON’T FORGET"
};

const TAB_KEYS_IN_ORDER = ["dueToday", "soon", "asSoonAsICan", "dontForget"];

/* -------------------------------
   STATE (defaults)
-------------------------------- */
let TASKS_BY_TAB = {
  dueToday: ["Email landlord", "Finish capstone work", "Take meds"],
  soon: ["Clean kitchen", "Grocery run"],
  asSoonAsICan: ["Organize closet", "Call dentist"],
  dontForget: ["Buy cat food", "Pay credit card"]
};

let COMPLETED_TASKS = {
  dueToday: [],
  soon: [],
  asSoonAsICan: [],
  dontForget: []
};

let activeTabKey = "dueToday";

/* Which task is currently “focused” in the timer dropdown */
let focusedTask = {
  tabKey: null,
  taskText: null
};

/* -------------------------------
   HELPERS
-------------------------------- */
function normalizeTabKey(raw) {
  // Supports common variants in HTML just in case
  const map = {
    dueToday: "dueToday",
    "due-today": "dueToday",
    due_today: "dueToday",

    soon: "soon",

    asSoonAsICan: "asSoonAsICan",
    "as-soon-as-i-can": "asSoonAsICan",
    as_soon_as_i_can: "asSoonAsICan",

    dontForget: "dontForget",
    "dont-forget": "dontForget",
    "don't-forget": "dontForget",
    dont_forget: "dontForget"
  };

  return map[raw] || raw;
}

function getLabel(tabKey) {
  return TAB_LABELS[tabKey] || tabKey;
}

function safeEnsureTabBuckets() {
  // Prevent crashes if storage is missing keys
  TAB_KEYS_IN_ORDER.forEach((k) => {
    if (!TASKS_BY_TAB[k]) TASKS_BY_TAB[k] = [];
    if (!COMPLETED_TASKS[k]) COMPLETED_TASKS[k] = [];
  });
}

/* -------------------------------
   SAVE / LOAD
-------------------------------- */
function saveState() {
  const state = {
    tasksByTab: TASKS_BY_TAB,
    completedByTab: COMPLETED_TASKS,
    activeTabKey: activeTabKey,
    focusedTask: focusedTask
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
    if (
      parsed.focusedTask &&
      typeof parsed.focusedTask === "object" &&
      typeof parsed.focusedTask.tabKey === "string" &&
      typeof parsed.focusedTask.taskText === "string"
    ) {
      focusedTask = parsed.focusedTask;
    }

    safeEnsureTabBuckets();
  } catch (err) {
    console.warn("Saved state corrupted; using defaults.", err);
  }
}

/* -------------------------------
   HEADINGS
-------------------------------- */
function syncHeadings(tabKey) {
  if (!elTasksHeading) return;
  elTasksHeading.textContent = `${getLabel(tabKey)}:`;
}

/* -------------------------------
   TAB UI
-------------------------------- */
function syncActiveTabUI(tabsNodeList, tabKey) {
  tabsNodeList.forEach((t) => {
    const key = normalizeTabKey(t.dataset.tab);
    const isActive = key === tabKey;

    t.classList.toggle("tab--active", isActive);

    if (isActive) t.setAttribute("aria-current", "page");
    else t.removeAttribute("aria-current");
  });
}

/* -------------------------------
   FOCUS DROPDOWN (timer select)
   - grouped by tab using <optgroup> (labels NOT selectable)
-------------------------------- */
function renderFocusSelect() {
  if (!elFocusSelect) return;

  elFocusSelect.innerHTML = "";

  // Placeholder option
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Pick a task";
  elFocusSelect.appendChild(placeholder);

  TAB_KEYS_IN_ORDER.forEach((tabKey) => {
    const tasks = TASKS_BY_TAB[tabKey] || [];

    // Optionally: do NOT include completed tasks in focus menu
    const available = tasks.filter((t) => !(COMPLETED_TASKS[tabKey] || []).includes(t));

    const group = document.createElement("optgroup");
    group.label = getLabel(tabKey);

    available.forEach((taskText) => {
      const opt = document.createElement("option");
      // value encodes tab + task so duplicates across tabs are fine
      opt.value = `${tabKey}||${taskText}`;
      opt.textContent = taskText;
      group.appendChild(opt);
    });

    elFocusSelect.appendChild(group);
  });

  // Restore selection if focusedTask exists
  if (focusedTask.tabKey && focusedTask.taskText) {
    const targetVal = `${focusedTask.tabKey}||${focusedTask.taskText}`;
    elFocusSelect.value = targetVal;
  }
}

function setFocusedTask(tabKey, taskText) {
  focusedTask = { tabKey, taskText };
  saveState();
  renderFocusSelect();
}

/* -------------------------------
   RENDER TASKS (active tab only)
   - clicking a task sets focus
   - checking completes + saves
-------------------------------- */
function renderTasks(tabKey) {
  if (!elTaskList) return;

  elTaskList.innerHTML = "";

  const tasks = (TASKS_BY_TAB[tabKey] || []).filter(
    (t) => !(COMPLETED_TASKS[tabKey] || []).includes(t)
  );

  tasks.forEach((taskText) => {
    const li = document.createElement("li");
    li.className = "task";

    // optional highlight if focused
    const isFocused = focusedTask.tabKey === tabKey && focusedTask.taskText === taskText;
    if (isFocused) li.classList.add("task--focused");

    li.innerHTML = `
      <label class="task-row">
        <input class="task-checkbox" type="checkbox" />
        <span class="task-text">${taskText}</span>
      </label>
    `;

    // Clicking the text row sets focus for timer
    li.addEventListener("click", (e) => {
      // Don’t steal the click from checkbox toggle logic
      if (e.target.classList.contains("task-checkbox")) return;

      setFocusedTask(tabKey, taskText);
      renderTasks(tabKey); // refresh highlight
    });

    const checkbox = li.querySelector(".task-checkbox");
    checkbox.addEventListener("change", (e) => {
      if (!e.target.checked) return;

      if (!COMPLETED_TASKS[tabKey].includes(taskText)) {
        COMPLETED_TASKS[tabKey].push(taskText);
      }

      // If you complete the focused task, clear focus
      if (focusedTask.tabKey === tabKey && focusedTask.taskText === taskText) {
        focusedTask = { tabKey: null, taskText: null };
      }

      saveState();
      renderTasks(tabKey);
      renderCompletedGrouped();
      renderFocusSelect();
    });

    elTaskList.appendChild(li);
  });
}

/* -------------------------------
   COMPLETED LIST (GROUPED BY TAB)
-------------------------------- */
function renderCompletedGrouped() {
  if (!elCompletedList) return;

  elCompletedList.innerHTML = "";

  TAB_KEYS_IN_ORDER.forEach((tabKey) => {
    const done = COMPLETED_TASKS[tabKey] || [];
    if (done.length === 0) return;

    // Group heading
    const heading = document.createElement("li");
    heading.className = "completed-heading";
    heading.textContent = getLabel(tabKey);
    elCompletedList.appendChild(heading);

    done.forEach((taskText) => {
      const li = document.createElement("li");
      li.className = "completed-item";
      li.textContent = taskText;
      elCompletedList.appendChild(li);
    });
  });
}

/* -------------------------------
   ADD TASK (to ACTIVE tab)
   - adds to TASKS_BY_TAB[activeTabKey]
   - saves
   - rerenders
   - auto-focuses new task + selects in dropdown
-------------------------------- */
function addTaskFromInput() {
  if (!elTaskInput) return;

  const raw = elTaskInput.value.trim();
  if (!raw) return;

  const tabKey = activeTabKey;

  // prevent exact duplicates in same tab (optional)
  if (!TASKS_BY_TAB[tabKey].includes(raw)) {
    TASKS_BY_TAB[tabKey].push(raw);
  }

  // Set this new task as focused immediately
  focusedTask = { tabKey, taskText: raw };

  elTaskInput.value = "";

  saveState();
  renderTasks(tabKey);
  renderCompletedGrouped();
  renderFocusSelect();
}

/* -------------------------------
   INIT
-------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab");

  loadState(); // load first

  // Normalize active tab (in case storage had an old value)
  activeTabKey = normalizeTabKey(activeTabKey);
  safeEnsureTabBuckets();

  // Tabs
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const selectedTab = normalizeTabKey(tab.dataset.tab);
      activeTabKey = selectedTab;

      syncActiveTabUI(tabs, activeTabKey);
      syncHeadings(activeTabKey);

      renderTasks(activeTabKey);
      renderCompletedGrouped();
      renderFocusSelect();

      saveState();
    });
  });

  // Add task
  if (elAddTaskBtn) elAddTaskBtn.addEventListener("click", addTaskFromInput);

  // Enter key adds task too (optional but nice)
  if (elTaskInput) {
    elTaskInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addTaskFromInput();
    });
  }

  // Changing dropdown sets focus
  if (elFocusSelect) {
    elFocusSelect.addEventListener("change", (e) => {
      const val = e.target.value;
      if (!val) {
        focusedTask = { tabKey: null, taskText: null };
        saveState();
        renderTasks(activeTabKey);
        return;
      }

      const [tabKey, taskText] = val.split("||");
      focusedTask = { tabKey, taskText };
      saveState();

      // if focused task is in a different tab, we do NOT auto-switch tabs (MVP rule)
      renderTasks(activeTabKey);
    });
  }

  // First paint
  syncActiveTabUI(tabs, activeTabKey);
  syncHeadings(activeTabKey);

  renderTasks(activeTabKey);
  renderCompletedGrouped();
  renderFocusSelect();
});