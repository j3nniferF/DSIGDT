let tasks = [];
let chart = null;
let tabs = [];
let activeTabId = "tab_dumb";
let editingTabId = null;

// reminder popup msgs
let reminderSettings = {
  frequency: 20,
  messages: [
    "♡ Unclench your jaw!",
    "♡ Drink some water!",
    "♡ Take a deep breath!",
    "♡ Get yourself a snack!",
    "♡ Stretch your shoulders!",
    "♡ Check your posture!",
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
  initializeTimerDrag();
  initializeTimesUpModal();
  initializeReward();
  initializeResetModal();
  initializeAboutModal();
  initializeSounds();
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
    hideReminderBanner();
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
      header.innerHTML = `<span>${tab.name.toUpperCase()}</span>`;
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

  tabs.forEach((tab) => {
    const tabTotal = tasks.filter((t) => t.tabId === tab.id).length;
    const tabDone = tasks.filter(
      (t) => t.tabId === tab.id && t.completed,
    ).length;

    if (tabDone === 0) return;

    // outside shell
    const card = document.createElement("div");
    card.className = "flip-card";

    // rotating bits
    const inner = document.createElement("div");
    inner.className = "flip-card-inner";

    // front
    const front = document.createElement("div");
    front.className = "flip-card-front";
    front.innerHTML = `
      <span class="flip-card-heart">♡</span>
      <div class="flip-card-tab-pill">
        <span class="flip-card-tab-name">${tab.name}</span>
      </div>
      <span class="flip-card-count">${tabDone} of ${tabTotal}</span>
    `;

    // back face
    const back = document.createElement("div");
    back.className = "flip-card-back";

    tasks
      .filter((t) => t.tabId === tab.id && t.completed)
      .forEach((task) => {
        const item = buildTaskItem(task);
        item.classList.add("completed");
        back.appendChild(item);
      });

    // click card anywhere → toggle flip
    card.addEventListener("click", () => {
      card.classList.toggle("is-flipped");
    });

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);
    list.appendChild(card);
  });

  // ALL card — summary of everything completed across all tabs
  const allTotal = tasks.length;
  const allDone = tasks.filter((t) => t.completed).length;

  if (allDone > 0) {
    const card = document.createElement("div");
    card.className = "flip-card flip-card--all";

    const inner = document.createElement("div");
    inner.className = "flip-card-inner";

    const front = document.createElement("div");
    front.className = "flip-card-front";
    front.innerHTML = `
      <span class="flip-card-heart">♡</span>
      <div class="flip-card-tab-pill">
        <span class="flip-card-tab-name">ALL</span>
      </div>
      <span class="flip-card-count">${allDone} of ${allTotal}</span>
    `;

    const back = document.createElement("div");
    back.className = "flip-card-back";

    tasks
      .filter((t) => t.completed)
      .forEach((task) => {
        const item = buildTaskItem(task);
        item.classList.add("completed");
        back.appendChild(item);
      });

    // click card anywhere → toggle flip
    card.addEventListener("click", () => {
      card.classList.toggle("is-flipped");
    });

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);
    list.appendChild(card);
  }
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

  if (!wasCompleted) {
    const stats = loadStats();
    const today = new Date().toISOString().split("T")[0];
    stats.completedTasks += 1;
    stats.completionByDate[today] = (stats.completionByDate[today] || 0) + 1;
    saveStats(stats);
  }
  renderTasks();

  if (!wasCompleted) {
    playChime("task");
    // ..everyone likes prizes, so here's some fun confetti after finishing any single task..
    confetti({ particleCount: 666, spread: 50, origin: { y: 0.6 } });

    // ..but only get the pleasure to gaze upon the greatness that is..
    // ..the mighty Goober whenever finishing ALL the tasks in a tab!!
    if (isTabFullyCompleted(task.tabId)) {
      setTimeout(() => showReward(), 400);
    }
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

function loadStats() {
  const saved = localStorage.getItem("dsigdt_stats");
  return saved
    ? JSON.parse(saved)
    : { completedTasks: 0, timerSessions: 0, completionByDate: {} };
}

function saveStats(stats) {
  localStorage.setItem("dsigdt_stats", JSON.stringify(stats));
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
  if (document.querySelector(".reward-overlay:not(.is-hidden)")) return;
  if (reminderSettings.messages.length === 0) return;
  const msg =
    reminderSettings.messages[
      Math.floor(Math.random() * reminderSettings.messages.length)
    ];
  document.getElementById("reminder-message").textContent = msg.replace(
    /^\s*[♡♥]+\s*|\s*[♡♥]+\s*$/g,
    "",
  );
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
    span.textContent = msg.replace(/\s*[♡♥]+\s*$/, "");
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
    hideReminderBanner();
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
    reminderSettings.messages.push("♡ " + text);
    saveReminderSettings();
    renderRemindersList();
    addInput.value = "";
  });

  addInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") document.getElementById("reminders-add-btn").click();
  });
}

// draw / update chart- done vs to do
function renderChart() {
  const canvasEl = document.getElementById("stats-chart");
  if (!canvasEl) return;
  if (typeof Chart === "undefined") return;

  const tabData = tabs
    .map((tab) => ({
      name: tab.name,
      count: tasks.filter((t) => t.tabId === tab.id && t.completed).length,
    }))
    .filter((d) => d.count > 0);

  if (tabData.length === 0) return;

  const labels = tabData.map((d) => d.name);
  const data = tabData.map((d) => d.count);
  const colors = [
    "#ff6eb4",
    "#dd44ff",
    "#5599ff",
    "#44ddaa",
    "#ffdd44",
    "#ff9933",
  ];

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
    return;
  }

  const ctx = canvasEl.getContext("2d");
  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors.slice(0, data.length),
          borderColor: "#fff",
          borderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true, position: "bottom" },
      },
      cutout: "65%",
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
      { id: "tab_dumb", name: "GOTTA" },
      { id: "tab_today", name: "WANNA" },
      { id: "tab_other", name: "OTHER" },
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
    });
    container.appendChild(btn);
    btn.addEventListener("dblclick", () => openTabEditModal(tab.id));
  });

  // permanent "all stuff" tab — cannot be renamed or deleted
  const allBtn = document.createElement("button");
  const allSpan = document.createElement("span");
  allSpan.textContent = "ALL";
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
  });

  container.appendChild(allBtn);
  allBtn.addEventListener("dblclick", () => openTabEditModal("__all_tasks__"));
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

// sound toggle — saved to localStorage so it remembers between visits
let soundEnabled = JSON.parse(localStorage.getItem("dsigdt_sound") ?? "true");

// tracks which task ID is running in the timer
let selectedTimerTaskId = null;

// helper: resets everything and goes back to setup view
function goToSetup() {
  const modal = document.getElementById("timer-modal");
  const display = document.getElementById("timer-display");

  // reset drag position
  modal.style.cssText = "";
  document.getElementById("timer-overlay").style.alignItems = "";
  document.getElementById("timer-overlay").style.justifyContent = "";

  const pauseBtn = document.getElementById("timer-pause");

  clearInterval(timerInterval);
  timerInterval = null;
  timerSeconds = 0;
  totalTimerSeconds = 0;
  selectedTimerTaskId = null;

  display.classList.remove("is-running");
  display.textContent = "25:00";
  if (pauseBtn) pauseBtn.textContent = "Pause";

  // swap state classes on the modal inner div
  modal.classList.remove("is-running");
  modal.classList.add("is-setup");

  // reset draining border back to full
  modal.style.setProperty("--timer-pct", 100);
  modal.classList.remove("is-warning", "is-danger");

  populateTimerTasks();
}

// the actual countdown tick — extracted so +5 min can reuse it
function startCountdown() {
  clearInterval(timerInterval); // always kill any existing interval before starting a new one
  timerInterval = null;
  const display = document.getElementById("timer-display");

  timerInterval = setInterval(() => {
    timerSeconds--;
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    display.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    // update draining border — ratio goes from 1.0 down to 0
    const ratio = timerSeconds / totalTimerSeconds;
    const modal = document.getElementById("timer-modal");
    modal.style.setProperty("--timer-pct", Math.round(ratio * 100));

    // color state on the card border
    if (ratio <= 0.2) {
      modal.classList.remove("is-warning");
      modal.classList.add("is-danger");
    } else if (ratio <= 0.5) {
      modal.classList.remove("is-danger");
      modal.classList.add("is-warning");
    } else {
      modal.classList.remove("is-warning", "is-danger");
    }

    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      display.classList.remove("is-running");
      showTimesUp();
    }
  }, 1000);
}

// show the time's up modal with task info filled in
function showTimesUp() {
  playChime("timer");
  const timerOverlay = document.getElementById("timer-overlay");
  const timesupOverlay = document.getElementById("timesup-overlay");
  const taskNameEl = document.getElementById("timesup-task-name");

  const task = tasks.find((t) => t.id === parseInt(selectedTimerTaskId));
  if (task) {
    const tab = tabs.find((t) => t.id === task.tabId);
    taskNameEl.textContent = `"${task.text}"${tab ? " from " + tab.name : ""}`;
  } else {
    taskNameEl.textContent = "your timer session";
  }

  // hide timer, show timesup
  timerOverlay.classList.add("is-hidden");
  timesupOverlay.classList.remove("is-hidden");
}

function initializeTimer() {
  const btn = document.getElementById("timer-btn");
  const overlay = document.getElementById("timer-overlay"); // show/hide
  const modal = document.getElementById("timer-modal"); // state classes
  const display = document.getElementById("timer-display");
  const startBtn = document.getElementById("timer-start");
  const pauseBtn = document.getElementById("timer-pause");
  const closeBtn = document.getElementById("timer-close");
  const taskLabel = document.getElementById("timer-task-label");
  const taskSelect = document.getElementById("timer-task-select");

  // open/close the overlay
  btn.addEventListener("click", () => {
    if (overlay.classList.contains("is-hidden")) {
      overlay.classList.remove("is-hidden");
      populateTimerTasks();
      populateDialColumns();
    } else {
      overlay.classList.add("is-hidden");
    }
  });

  closeBtn.addEventListener("click", () => {
    overlay.classList.add("is-hidden");
  });

  // START: read the dial, switch to running view, begin countdown
  startBtn.addEventListener("click", () => {
    timerSeconds = getDialSeconds();
    totalTimerSeconds = timerSeconds;
    if (timerSeconds <= 0) return;

    // remember which task was chosen
    const selectedOption = taskSelect.options[taskSelect.selectedIndex];
    selectedTimerTaskId =
      selectedOption && selectedOption.value ? selectedOption.value : null;

    // set the "working on" label
    taskLabel.textContent =
      selectedOption && selectedOption.value
        ? selectedOption.textContent.trim()
        : "✨ any stuff! ✨";

    // reset draining border to full before countdown starts
    modal.style.setProperty("--timer-pct", 100);
    modal.classList.remove("is-warning", "is-danger");

    // switch to running view — state classes live on the inner modal div
    modal.classList.remove("is-setup");
    modal.classList.add("is-running");
    display.classList.add("is-running");

    startCountdown();
  });

  // PAUSE / RESUME toggle
  pauseBtn.addEventListener("click", () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      pauseBtn.textContent = "Resume";
      display.classList.remove("is-running");
    } else {
      pauseBtn.textContent = "Pause";
      display.classList.add("is-running");
      startCountdown();
    }
  });

  // DONE! — clear interval first, then trigger timesup (prevents double-chime)
  document.getElementById("timer-done").addEventListener("click", () => {
    clearInterval(timerInterval);
    timerInterval = null;
    showTimesUp();
  });

  // RESET — cancels timer and goes back to setup view
  document
    .getElementById("timer-reset-btn")
    .addEventListener("click", goToSetup);
}

// wire up the time's up modal buttons
function initializeTimesUpModal() {
  // YES, DONE — mark the task complete and go home
  document.getElementById("timesup-done-btn").addEventListener("click", () => {
    if (selectedTimerTaskId) {
      const taskId = parseInt(selectedTimerTaskId);
      const task = tasks.find((t) => t.id === taskId);
      // toggleTask marks it complete + checks if tab is fully done → Goober
      if (task && !task.completed) toggleTask(taskId);
    } else {
      // free timer — no task selected, still deserves confetti!
      confetti({ particleCount: 666, spread: 50, origin: { y: 0.6 } });
    }
    document.getElementById("timesup-overlay").classList.add("is-hidden");
    goToSetup();
  });

  // +5 MIN — add 5 minutes and keep going
  document.getElementById("timesup-more-btn").addEventListener("click", () => {
    timerSeconds = 300;
    totalTimerSeconds = 300;

    const display = document.getElementById("timer-display");
    const timerOverlay = document.getElementById("timer-overlay");
    const modal = document.getElementById("timer-modal");
    modal.style.setProperty("--timer-pct", 100);
    modal.classList.remove("is-warning", "is-danger");
    display.textContent = "05:00";
    display.classList.add("is-running");

    document.getElementById("timesup-overlay").classList.add("is-hidden");
    timerOverlay.classList.remove("is-hidden");

    startCountdown();
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
  gif.onload = () => overlay.classList.remove("is-hidden");
  gif.src = CONFIG.gooberGif;
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
      { id: "tab_dumb", name: "GOTTA" },
      { id: "tab_today", name: "WANNA" },
      { id: "tab_other", name: "OTHER" },
    ];

    activeTabId = "tab_dumb";
    reminderSettings = {
      frequency: 20,
      messages: [
        "♡ Unclench your jaw!",
        "♡ Drink some water!",
        "♡ Stretch your shoulders!",
        "♡ Take a deep breath!",
        "♡ Check your posture!",
      ],
    };
    saveReminderSettings();
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

// about modal
function initializeAboutModal() {
  document.getElementById("about-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    hideReminderBanner();
    document.getElementById("about-overlay").classList.remove("is-hidden");
  });
  document.getElementById("about-close").addEventListener("click", () => {
    document.getElementById("about-overlay").classList.add("is-hidden");
    // flip all about cards back to front when modal closes
    document.querySelectorAll(".about-card.is-flipped").forEach((c) => {
      c.classList.remove("is-flipped");
    });
  });

  // card flip
  document.querySelectorAll(".about-card").forEach((card) => {
    card.addEventListener("click", () => {
      card.classList.toggle("is-flipped");
    });
  });
}

// stats stuff!
document.getElementById("stats-btn").addEventListener("click", () => {
  hideReminderBanner();
  document.getElementById("stats-overlay").classList.remove("is-hidden");
  renderChart();
});

document.getElementById("stats-close").addEventListener("click", () => {
  document.getElementById("stats-overlay").classList.add("is-hidden");
});

// drag the timer modal by its TIMER title
function initializeTimerDrag() {
  const overlay = document.getElementById("timer-overlay");
  const modal = document.getElementById("timer-modal");
  // grab BOTH drag handels (setup view + running view)
  const handles = modal.querySelectorAll(".timer-drag-handle");

  let dragging = false;
  let startMouseX, startMouseY, startLeft, startTop;

  function onDragStart(e) {
    const rect = modal.getBoundingClientRect();
    startMouseX = e.clientX;
    startMouseY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;
    dragging = true;
    // switch from flex-centered to fixed with exact coordinates
    modal.style.position = "fixed";
    modal.style.left = startLeft + "px";
    modal.style.top = startTop + "px";
    modal.style.margin = "0";
    modal.style.transform = "none";
    overlay.style.alignItems = "flex-start";
    overlay.style.justifyContent = "flex-start";
    e.preventDefault();
  }

  function onDragMove(e) {
    if (!dragging) return;
    modal.style.left = startLeft + e.clientX - startMouseX + "px";
    modal.style.top = startTop + e.clientY - startMouseY + "px";
  }

  function onDragEnd() {
    dragging = false;
  }

  handles.forEach((h) => {
    h.addEventListener("mousedown", onDragStart);
    h.addEventListener("touchstart", (e) => onDragStart(e.touches[0]), {
      passive: false,
    });
  });
  document.addEventListener("mousemove", onDragMove);
  document.addEventListener("touchmove", (e) => onDragMove(e.touches[0]), {
    passive: false,
  });
  document.addEventListener("mouseup", onDragEnd);
  document.addEventListener("touchend", onDragEnd);
}

// update the sound button to show on/off state visually
function updateSoundBtn() {
  const btn = document.getElementById("sound-btn");
  btn.style.opacity = soundEnabled ? "1" : "0.4";
  btn.title = soundEnabled ? "Sound: ON" : "Sound: OFF";
}

// play a chime using the Web Audio API — no files needed!
function playChime(type = "task") {
  if (!soundEnabled) return;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  if (type === "task") {
    // single soft chime for task complete
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 523; // C5
    osc.type = "sine";
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } else if (type === "timer") {
    // little C-E-G melody for timer done
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + i * 0.18 + 0.35,
      );
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.35);
    });
  }
}

function initializeSounds() {
  updateSoundBtn();
  document.getElementById("sound-btn").addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem("dsigdt_sound", JSON.stringify(soundEnabled));
    updateSoundBtn();
  });
}
