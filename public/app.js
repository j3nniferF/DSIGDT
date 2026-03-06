let tasks = [];
let chart = null;
let tabs = [];
let activeTabId = "tab_dumb";
let editingTabId = null;

// reminder popup msgs
let reminderSettings = {
  frequency: 20,
  messages: [
    "♡ Unclench your jaw! ♡",
    "♡ Drink some water! ♡",
    "♡ Take a deep breath! ♡",
    "♡ Get yourself a snack! ♡",
    "♡ Stretch your shoulders! ♡",
    "♡ Check your posture! ♡",
  ],
};
let reminderIntervalId = null;
let reminderAutoHide = null;

// dom content block
document.addEventListener("DOMContentLoaded", () => {
  loadTabs();
  loadTasks();
  initializeTasks();
  initializeTabs();
  loadQuote();
  loadReminderSettings();
  initializeReminders();
  initializeTimer();
  initializeReward();
  initializeResetModal();
  initializeRemindersSettings();
  initializeTabEditModal();
});

// add + render tasks
function initializeTasks() {
  const input = document.getElementById("task-input");
  const addBtn = document.getElementById("add-task-btn");

  addBtn.addEventListener("click", addTask);

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addTask();
  });

  // reset btn resets ALL STUFF if selected
  const resetBtn = document.getElementById("reset-btn");
  resetBtn.addEventListener("click", () => {
    document.getElementById("reset-overlay").classList.remove("is-hidden");
  });
}

function addTask() {
  const input = document.getElementById("task-input");
  const text = input.value.trim();

  if (text === "") return;

  const task = {
    id: Date.now(),
    text: text,
    completed: false,
    tabId: activeTabId,
  };

  tasks.push(task);
  saveTasks();
  renderTasks();
  input.value = "";
}

// return single <li> task in normal and all stuff views
function buildTaskItem(task) {
  const li = document.createElement("li");
  li.className = "task-item";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  checkbox.addEventListener("change", () => toggleTask(task.id));

  const label = document.createElement("label");
  label.textContent = task.text;

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "x";
  deleteBtn.className = "delete-btn";
  deleteBtn.addEventListener("click", () => deleteTask(task.id));

  li.appendChild(checkbox);
  li.appendChild(label);
  li.appendChild(deleteBtn);
  return li;
}

// render tasks to page
function renderTasks() {
  const list = document.getElementById("task-list");
  const empty = document.getElementById("tasks-empty");
  const input = document.getElementById("task-input");
  const addBtn = document.getElementById("add-task-btn");
  list.innerHTML = "";

  // ALL STUFF grouped and add disabled
  if (activeTabId === "__all_tasks__") {
    input.disabled = true;
    input.placeholder = "Viewing all stuff - select a tab to add";
    addBtn.disabled = true;
    empty.classList.add("is-hidden");

    // loop through tabs
    tabs.forEach((tab) => {
      const tabTasks = tasks.filter((t) => t.tabId === tab.id && !t.completed);
      if (tabTasks.length === 0) return; //skips empty tabs

      // tab name header
      const header = document.createElement("p");
      header.className = "all-stuff-tab-header";
      header.textContent = tab.name.toUpperCase();
      list.appendChild(header);

      // tasks for this tab
      tabTasks.forEach((task) => {
        const li = buildTaskItem(task);
        list.appendChild(li);
      });
    });

    renderChart();
    renderCompleted();
    return; //exit early!
  }

  // normal tab reenable add
  input.disabled = false;
  input.placeholder = "+ Add Stuff";
  input.disabled = false;

  const visibleTasks = tasks.filter(
    (task) =>
      (activeTabId === "__all_tasks__" || task.tabId === activeTabId) &&
      !task.completed,
  );

  if (visibleTasks.length === 0) {
    empty.classList.remove("is-hidden");
  } else {
    empty.classList.add("is-hidden");
  }

  visibleTasks.forEach((task) => {
    list.appendChild(buildTaskItem(task));
  });

  renderChart();
  renderCompleted();
}

// render completed to the "got done" card
function renderCompleted() {
  const list = document.getElementById("completed-list");
  const empty = document.getElementById("completed-empty");
  list.innerHTML = "";

  const anyCompleted = tasks.some((t) => t.completed);

  if (!anyCompleted) {
    empty.classList.remove("is-hidden");
    return;
  }

  empty.classList.add("is-hidden");

  const totalAll = tasks.length;
  const doneAll = tasks.filter((t) => t.completed).length;

  const allGroup = document.createElement("div");
  allGroup.className = "completed-group completed-group--all";
  allGroup.innerHTML = `
    <div class="completed-group-header">
      <span class="completed-tab-name">ALL STUFF</span>
      <span class="completed-stat">${doneAll} / ${totalAll} ♡</span>
    </div>
  `;
  list.appendChild(allGroup);

  tabs.forEach((tab) => {
    const tabTotal = tasks.filter((t) => t.tabId === tab.id).length;
    const tabDone = tasks.filter(
      (t) => t.tabId === tab.id && t.completed,
    ).length;

    if (tabDone === 0) return;

    const group = document.createElement("div");
    group.className = "completed-group";

    const header = document.createElement("div");
    header.className = "completed-group-header";
    header.innerHTML = `
      <span class="completed-tab-name">${tab.name.toUpperCase()}</span>
      <span class="completed-stat">${tabDone} / ${tabTotal} </span>
    `;
    group.appendChild(header);

    header.addEventListener("click", () => {
      group.classList.toggle("is-open");
    });

    tasks
      .filter((t) => t.tabId === tab.id && t.completed)
      .forEach((task) => {
        const li = buildTaskItem(task);
        li.classList.add("completed");
        group.appendChild(li);
      });

    list.appendChild(group);
  });
}

// toggle + delete + save + load
function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  const wasCompleted = task ? task.completed : false;

  tasks = tasks.map((t) => {
    if (t.id === id) {
      return { ...t, completed: !t.completed };
    }
    return t;
  });
  saveTasks();
  renderTasks();

  if (!wasCompleted && isTabFullyCompleted(task.tabId)) {
    setTimeout(() => showReward(), 400);
  }
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
}

function saveTasks() {
  localStorage.setItem("dsigdt_tasks", JSON.stringify(tasks));
}

function loadTasks() {
  const saved = localStorage.getItem("dsigdt_tasks");
  if (saved) {
    tasks = JSON.parse(saved);
  }
  renderTasks();
}

// fetch quote from affirmations.dev api
async function loadQuote() {
  const quoteEl = document.getElementById("quote");
  try {
    const response = await fetch("/api/quote");
    const data = await response.json();
    quoteEl.textContent = data.affirmation;
  } catch {
    quoteEl.textContent = "✨You're awesome! 🌟 Keep it up!✨";
  }
}

// reminder popups
function showReminderBanner() {
  if (reminderSettings.messages.length === 0) return;
  const msg =
    reminderSettings.messages[
      Math.floor(Math.random() * reminderSettings.messages.length)
    ];
  document.getElementById("reminder-message").textContent = msg;
  document.getElementById("reminder-popup").classList.add("is-showing");
  clearTimeout(reminderAutoHide);
  reminderAutoHide = setTimeout(hideReminderBanner, 10000);
}

function hideReminderBanner() {
  document.getElementById("reminder-popup").classList.remove("is-showing");
}

function startReminderInterval() {
  if (reminderIntervalId) clearInterval(reminderIntervalId);
  reminderIntervalId = setInterval(
    showReminderBanner,
    reminderSettings.frequency * 60 * 1000,
  );
}

function initializeReminders() {
  document
    .getElementById("reminder-dismiss")
    .addEventListener("click", hideReminderBanner);
  startReminderInterval();
}

function renderRemindersList() {
  const list = document.getElementById("reminders-list");
  list.innerHTML = "";
  reminderSettings.messages.forEach((msg, index) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = msg;
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "x";
    deleteBtn.className = "delete-btn";
    deleteBtn.addEventListener("click", () => {
      reminderSettings.messages.splice(index, 1);
      saveReminderSettings();
      renderRemindersList();
    });
    li.appendChild(span);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}

function initializeRemindersSettings() {
  document.getElementById("reminders-btn").addEventListener("click", () => {
    document.getElementById("reminders-frequency").value =
      reminderSettings.frequency;
    renderRemindersList();
    document.getElementById("reminders-overlay").classList.remove("is-hidden");
  });

  document.getElementById("reminders-close").addEventListener("click", () => {
    document.getElementById("reminders-overlay").classList.add("is-hidden");
  });

  document
    .getElementById("reminders-frequency")
    .addEventListener("change", (e) => {
      reminderSettings.frequency = parseInt(e.target.value);
      saveReminderSettings();
      startReminderInterval();
    });

  const addInput = document.getElementById("reminders-new-input");
  document.getElementById("reminders-add-btn").addEventListener("click", () => {
    const text = addInput.value.trim();
    if (!text) return;
    reminderSettings.messages.push(text);
    saveReminderSettings();
    renderRemindersList();
    addInput.value = "";
  });

  addInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") document.getElementById("reminders-add-btn").click();
  });
}

// draw or update the chart: done vs to do
function renderChart() {
  const completed = tasks.filter((task) => task.completed).length;
  const remaining = tasks.filter((task) => !task.completed).length;

  // update the x/x summary text
  const summary = document.getElementById("stats-summary");
  const total = tasks.length;
  if (total === 0) {
    summary.textContent = "Add some stuff to get started!";
  } else if (completed === total) {
    summary.textContent = `🎉 All ${total} / ${total} stuff done! Amazing!`;
  } else {
    summary.textContent = `${completed} / ${total} done!`;
  }

  // if chart already exists, update the numbers
  if (chart) {
    chart.data.datasets[0].data = [completed, remaining];
    chart.update();
    return;
  }

  // first time: create the chart
  const ctx = document.getElementById("stats-chart").getContext("2d");
  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["To Do Stuff", "Stuff Done"],
      datasets: [
        {
          data: [completed, remaining],
          backgroundColor: ["#c14dcc", "#f0e0f5"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
      },
    },
  });
}

// load tabs from localStorage/  defaults if none saved
function loadTabs() {
  const saved = localStorage.getItem("dsigdt_tabs");
  if (saved) {
    tabs = JSON.parse(saved);
    const savedActive = localStorage.getItem("dsigdt_active_tab");
    if (savedActive) activeTabId = savedActive;
  } else {
    tabs = [
      { id: "tab_dumb", name: "dumb stuff" },
      { id: "tab_today", name: "gotta do today" },
      { id: "tab_other", name: "other stuff" },
    ];
    saveTabs();
  }
}

// save tabs + active tab to localStorage
function saveTabs() {
  localStorage.setItem("dsigdt_tabs", JSON.stringify(tabs));
  localStorage.setItem("dsigdt_active_tab", activeTabId);
}

// load reminder settings from localStorage
function loadReminderSettings() {
  const saved = localStorage.getItem("dsigdt_reminders");
  if (saved) reminderSettings = JSON.parse(saved);
}

// save reminder settings to localStorage
function saveReminderSettings() {
  localStorage.setItem("dsigdt_reminders", JSON.stringify(reminderSettings));
}

// moving slider for active tab
function moveTabIndicator() {
  const container = document.getElementById("task-tabs");
  const indicator = document.getElementById("tab-indicator");
  const active = container ? container.querySelector(".tab-btn.active") : null;
  if (!active || !indicator) return;
  indicator.style.width = active.offsetWidth + "px";
  indicator.style.transform = `translateX(${active.offsetLeft}px)`;
}

// render tab bts + handle clicks
function initializeTabs() {
  const container = document.getElementById("task-tabs");
  container.innerHTML = ""; // clear old buttons before re-rendering!

  const indicator = document.createElement("div");
  indicator.id = "tab-indicator";
  indicator.className = "tab-indicator";
  container.appendChild(indicator);

  tabs.forEach((tab) => {
    const btn = document.createElement("button");
    const span = document.createElement("span");
    span.textContent = tab.name;
    btn.appendChild(span);
    btn.className = tab.id === activeTabId ? "tab-btn active" : "tab-btn";
    btn.addEventListener("click", () => {
      activeTabId = tab.id;
      if (activeTabId !== "__all_tasks__") {
        document.getElementById("task-input").focus();
      }
      saveTabs();
      container
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderTasks();
      moveTabIndicator();
    });
    container.appendChild(btn);
    btn.addEventListener("dblclick", () => openTabEditModal(tab.id));
  });

  // permanent "all stuff" tab — cannot be renamed or deleted
  const allBtn = document.createElement("button");
  const allSpan = document.createElement("span");
  allSpan.textContent = "all stuff";
  allBtn.appendChild(allSpan);
  allBtn.className =
    activeTabId === "__all_tasks__" ? "tab-btn active" : "tab-btn";
  allBtn.addEventListener("click", () => {
    activeTabId = "__all_tasks__";
    saveTabs();
    container
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    allBtn.classList.add("active");
    renderTasks();
    moveTabIndicator();
  });

  container.appendChild(allBtn);

  requestAnimationFrame(moveTabIndicator);
}

function addTab(name) {
  if (tabs.length >= 3) return;
  const newTab = {
    id: "tab_" + Date.now(),
    name: name || "new stuff",
  };
  tabs.push(newTab);
  activeTabId = newTab.id;
  saveTabs();
  initializeTabs();
  renderTasks();
  document.getElementById("task-input").focus();
}

function openTabEditModal(tabId) {
  editingTabId = tabId;
  const isAllStuff = tabId === "__all_tasks__";
  const renameSection = document.getElementById("tab-edit-rename-section");
  const saveBtn = document.getElementById("tab-edit-save");
  const deleteBtn = document.getElementById("tab-edit-delete");
  const addNewBtn = document.getElementById("tab-edit-add-new");
  const title = document.querySelector("#tab-edit-overlay .reward-title");

  if (isAllStuff) {
    title.textContent = "Add a New Tab?";
    renameSection.classList.remove("is-hidden");
    saveBtn.classList.add("is-hidden");
    deleteBtn.classList.add("is-hidden");
    addNewBtn.classList.remove("is-hidden");
    document.getElementById("tab-edit-input").value = "";
    document.getElementById("tab-edit-input").placeholder = "Tab name...";
  } else {
    title.textContent = "Edit Tab";
    renameSection.classList.remove("is-hidden");
    saveBtn.classList.remove("is-hidden");
    deleteBtn.classList.remove("is-hidden");
    addNewBtn.classList.add("is-hidden");
    document.getElementById("tab-edit-input").value =
      tabs.find((t) => t.id === tabId)?.name || "";
    document.getElementById("tab-edit-input").placeholder = "";
  }

  document.getElementById("tab-edit-overlay").classList.remove("is-hidden");
  document.getElementById("tab-edit-input").focus();
}

function initializeTabEditModal() {
  document.getElementById("tab-edit-save").addEventListener("click", () => {
    const newName = document.getElementById("tab-edit-input").value.trim();
    if (newName) {
      const tab = tabs.find((t) => t.id === editingTabId);
      if (tab) tab.name = newName;
      saveTabs();
      initializeTabs();
    }
    document.getElementById("tab-edit-overlay").classList.add("is-hidden");
  });

  document.getElementById("tab-edit-delete").addEventListener("click", () => {
    if (tabs.length <= 1) {
      alert("You need at least one tab!");
      return;
    }
    tabs = tabs.filter((t) => t.id !== editingTabId);
    tasks.forEach((task) => {
      if (task.tabId === editingTabId) task.tabId = tabs[0].id;
    });
    activeTabId = tabs[0].id;
    saveTabs();
    saveTasks();
    initializeTabs();
    renderTasks();
    document.getElementById("tab-edit-overlay").classList.add("is-hidden");
  });

  document.getElementById("tab-edit-close").addEventListener("click", () => {
    document.getElementById("tab-edit-overlay").classList.add("is-hidden");
  });

  document.getElementById("tab-edit-add-new").addEventListener("click", () => {
    const name = document.getElementById("tab-edit-input").value.trim();
    document.getElementById("tab-edit-overlay").classList.add("is-hidden");
    addTab(name);
  });
}

// === timer ===
let timerInterval = null;
const DIAL_ITEM_HEIGHT = 30;
let timerSeconds = 0;
let totalTimerSeconds = 0;

function populateDialColumns() {
  const minsCol = document.getElementById("dial-mins");
  const secsCol = document.getElementById("dial-secs");

  // GUARD- only pop once
  if (minsCol.children.length > 0) return;

  function fillColumn(col, count) {
    for (let i = 0; i < count; i++) {
      const item = document.createElement("div");
      item.className = "dial-item";
      item.textContent = String(i).padStart(2, "0");
      col.appendChild(item);
    }
  }

  fillColumn(minsCol, 60);
  fillColumn(secsCol, 60);

  // scroll to 25:00 default after layout renders
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      minsCol.scrollTop = 25 * DIAL_ITEM_HEIGHT;
    });
  });
}

function getDialSeconds() {
  const mins = Math.round(
    document.getElementById("dial-mins").scrollTop / DIAL_ITEM_HEIGHT,
  );
  const secs = Math.round(
    document.getElementById("dial-secs").scrollTop / DIAL_ITEM_HEIGHT,
  );
  return mins * 60 + secs;
}

function initializeTimer() {
  const btn = document.getElementById("timer-btn");
  const panel = document.getElementById("timer-panel");
  const display = document.getElementById("timer-display");
  const startBtn = document.getElementById("timer-start");
  const resetBtn = document.getElementById("timer-reset");
  const closeBtn = document.getElementById("timer-close");
  const taskLabel = document.getElementById("timer-task-label");
  const taskSelect = document.getElementById("timer-task-select");
  const dialProgress = document.getElementById("dial-progress");

  // open panel + tasks, X panel
  btn.addEventListener("click", () => {
    if (panel.classList.contains("is-hidden")) {
      panel.classList.remove("is-hidden");
      panel.classList.add("is-entering");
      setTimeout(() => panel.classList.remove("is-entering"), 400);
      populateTimerTasks();
      populateDialColumns();
    } else {
      panel.classList.add("is-hidden");
    }
  });

  closeBtn.addEventListener("click", () => {
    panel.classList.add("is-hidden");
  });

  // start or pause
  startBtn.addEventListener("click", () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      startBtn.textContent = "Start";
      display.classList.remove("is-running");
      return;
    }

    if (timerSeconds === 0) {
      timerSeconds = getDialSeconds();
      totalTimerSeconds = timerSeconds;
      if (timerSeconds <= 0) return;
      panel.classList.remove("is-done");
      dialProgress.style.transition = "none";
      dialProgress.style.strokeDashoffset = 0;
      void dialProgress.offsetWidth;
      dialProgress.style.transition = "";
    }
    panel.classList.add("is-running");

    startBtn.textContent = "Pause";
    const selectedTask = taskSelect.options[taskSelect.selectedIndex];
    taskLabel.textContent =
      selectedTask && selectedTask.value
        ? selectedTask.textContent.trim()
        : "✨ any stuff! ✨";

    display.classList.add("is-running");

    timerInterval = setInterval(() => {
      timerSeconds--;
      const mins = Math.floor(timerSeconds / 60);
      const secs = timerSeconds % 60;
      display.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
      dialProgress.style.strokeDashoffset =
        314 * (1 - timerSeconds / totalTimerSeconds);

      if (timerSeconds <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        startBtn.textContent = "Start";
        timerSeconds = 0;
        display.textContent = "Done!";
        taskLabel.textContent = "";
        panel.classList.remove("is-running");
        panel.classList.add("is-done");
      }
    }, 1000);
  });

  // reset
  resetBtn.addEventListener("click", () => {
    clearInterval(timerInterval);
    timerInterval = null;
    timerSeconds = 0;
    startBtn.textContent = "Start";
    display.classList.remove("is-running");
    display.textContent = "00:00";
    panel.classList.remove("is-running");
    panel.classList.remove("is-done");
    dialProgress.style.strokeDashoffset = 0;
  });
}

// fill task dropdown with incomplete tasks
function populateTimerTasks() {
  const select = document.getElementById("timer-task-select");
  select.innerHTML = '<option value="">Choose Stuff!</option>';

  tabs.forEach((tab) => {
    const tabTasks = tasks.filter(
      (task) => task.tabId === tab.id && !task.completed,
    );
    if (tabTasks.length === 0) return;

    const header = document.createElement("option");
    header.textContent = `— ${tab.name} —`;
    header.disabled = true;
    select.appendChild(header);

    tabTasks.forEach((task) => {
      const option = document.createElement("option");
      option.value = task.id;
      option.textContent = `  ${task.text}`;
      select.appendChild(option);
    });
  });
}

// check if all tasks in tab are completed
function isTabFullyCompleted(tabId) {
  const tabTasks = tasks.filter((task) => task.tabId === tabId);
  return tabTasks.length > 0 && tabTasks.every((task) => task.completed);
}

// show reward modal and confetti
function showReward() {
  const overlay = document.getElementById("reward-overlay");
  const gif = document.getElementById("reward-gif");
  gif.src = CONFIG.gooberGif;
  overlay.classList.remove("is-hidden");
  confetti({
    particleCount: 150,
    spread: 80,
    origin: { y: 0.6 },
  });
}

// hide reward modal
function hideReward() {
  document.getElementById("reward-overlay").classList.add("is-hidden");
}

// wire up close btns
function initializeReward() {
  document
    .getElementById("reward-close-X")
    .addEventListener("click", hideReward);
  document
    .getElementById("reward-close-btn")
    .addEventListener("click", hideReward);
}

// wire up reset confirm modal
function initializeResetModal() {
  const overlay = document.getElementById("reset-overlay");
  document.getElementById("reset-confirm-btn").addEventListener("click", () => {
    clearInterval(timerInterval);
    timerInterval = null;
    timerSeconds = 0;
    document.getElementById("timer-start").textContent = "Start";
    document.getElementById("timer-display").textContent = "25:00";
    document.getElementById("timer-display").classList.remove("is-running");
    document.getElementById("timer-task-label").textContent = "";
    tasks = [];
    tabs = [
      { id: "tab_dumb", name: "dumb stuff" },
      { id: "tab_today", name: "gotta do today" },
      { id: "tab_other", name: "other stuff" },
    ];

    activeTabId = "tab_dumb";
    saveTasks();
    saveTabs();
    initializeTabs();
    renderTasks();
    overlay.classList.add("is-hidden");
  });

  document.getElementById("reset-cancel-btn").addEventListener("click", () => {
    overlay.classList.add("is-hidden");
  });
}
