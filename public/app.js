let tasks = [];
let chart = null;
let tabs = [];
let activeTabId = "tab_dumb";

// reminder popup msgs
const reminderMessages = [
  "Unclench your jaw! 💜",
  "Drink some water! 💧",
  "Take a deep breath! 🌬️",
  "Get yourself a snack! 🥤🥗🍔🍟",
  "Stretch your shoulders! 🙆",
  "Check your posture! ⬆️",
];

// dom content block
document.addEventListener("DOMContentLoaded", () => {
  loadTabs();
  loadTasks();
  initializeTasks();
  initializeTabs();
  loadQuote();
  initializeReminders();
  initializeTimer();
  initializeReward();
  initializeResetModal();
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

// render tasks to page
function renderTasks() {
  const list = document.getElementById("task-list");
  const empty = document.getElementById("tasks-empty");
  list.innerHTML = "";

  const visibleTasks = tasks.filter(
    (task) => task.tabId === activeTabId && !task.completed,
  );

  if (visibleTasks.length === 0) {
    empty.classList.remove("is-hidden");
  } else {
    empty.classList.add("is-hidden");
  }

  visibleTasks.forEach((task) => {
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
    list.appendChild(li);
  });

  renderChart();
  renderCompleted();
}

// render completed to the "got done" card
function renderCompleted() {
  const list = document.getElementById("completed-list");
  const empty = document.getElementById("completed-empty");
  list.innerHTML = "";

  const completedTasks = tasks.filter(
    (task) => task.tabId === activeTabId && task.completed,
  );

  if (completedTasks.length === 0) {
    empty.classList.remove("is-hidden");
  } else {
    empty.classList.add("is-hidden");
    completedTasks.forEach((task) => {
      const li = document.createElement("li");
      li.className = "task-item completed";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = true;
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
      list.appendChild(li);
    });
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
    quoteEl.textContent = "✨You're doing awesome! 🌟 Keep it up!✨";
  }
}

// reminder popups: picks random msg, shows on timer, hides on dismiss
function initializeReminders() {
  const popup = document.getElementById("reminder-popup");
  const message = document.getElementById("reminder-message");
  const dismissBtn = document.getElementById("reminder-dismiss");

  // show random reminder every X secs
  setInterval(
    () => {
      const randomIndex = Math.floor(Math.random() * reminderMessages.length);
      message.textContent = reminderMessages[randomIndex];
      popup.classList.remove("is-hidden");
    },
    20 * 60 * 1000,
  );

  // hide when dismissed
  dismissBtn.addEventListener("click", () => {
    popup.classList.add("is-hidden");
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
    summary.textContent = `${completed} / ${total} stuff done!`;
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
      { id: "tab_dumb", name: "DUMB STUFF" },
      { id: "tab_other", name: "OTHER STUFF" },
    ];
    saveTabs();
  }
}

// save tabs + active tab to localStorage
function saveTabs() {
  localStorage.setItem("dsigdt_tabs", JSON.stringify(tabs));
  localStorage.setItem("dsigdt_active_tab", activeTabId);
}

// render tab bts + handle clicks
function initializeTabs() {
  const container = document.getElementById("task-tabs");
  container.innerHTML = ""; // clear old buttons before re-rendering!

  tabs.forEach((tab) => {
    const btn = document.createElement("button");
    btn.textContent = tab.name;
    btn.className = tab.id === activeTabId ? "tab-btn active" : "tab-btn";
    btn.addEventListener("click", () => {
      activeTabId = tab.id;
      saveTabs();
      container
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderTasks();
    });

    btn.addEventListener("dblclick", () => {
      const input = document.createElement("input");
      input.type = "text";
      input.value = tab.name;
      input.className = "tab-rename-input";
      btn.replaceWith(input);
      input.focus();
      input.select();

      function saveRename() {
        const newName = input.value.trim();
        if (newName) tab.name = newName;
        saveTabs();
        initializeTabs();
      }

      input.addEventListener("blur", saveRename);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") input.blur();
        if (e.key === "Escape") {
          input.removeEventListener("blur", saveRename);
          initializeTabs();
        }
      });
    });

    container.appendChild(btn);
  });
}

// === timer ===
let timerInterval = null;
let timerSeconds = 0;

function initializeTimer() {
  const btn = document.getElementById("timer-btn");
  const panel = document.getElementById("timer-panel");
  const display = document.getElementById("timer-display");
  const startBtn = document.getElementById("timer-start");
  const resetBtn = document.getElementById("timer-reset");
  const minutesInput = document.getElementById("timer-minutes");
  const closeBtn = document.getElementById("timer-close");

  // open panel + tasks, X panel
  btn.addEventListener("click", () => {
    panel.classList.toggle("is-hidden");
    if (!panel.classList.contains("is-hidden")) {
      populateTimerTasks();
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
      timerSeconds = parseInt(minutesInput.value) * 60;
    }

    startBtn.textContent = "Pause";
    display.classList.add("is-running");

    timerInterval = setInterval(() => {
      timerSeconds--;
      const mins = Math.floor(timerSeconds / 60);
      const secs = timerSeconds % 60;
      display.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

      if (timerSeconds <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        startBtn.textContent = "Start";
        timerSeconds = 0;
        display.textContent = "🎉 Done!";
        display.classList.remove("is-running");
        setTimeout(() => showReward(), 400);
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
    const mins = parseInt(minutesInput.value);
    display.textContent = `${String(mins).padStart(2, "0")}:00`;
  });
}

// fill task dropdown with active tab's incomplete tasks
function populateTimerTasks() {
  const select = document.getElementById("timer-task-select");
  const activeTasks = tasks.filter(
    (task) => task.tabId === activeTabId && !task.completed
  );
  select.innerHTML = '<option value="">✨ Choose a task...</option>';
  activeTasks.forEach((task) => {
    const option = document.createElement("option");
    option.value = task.id;
    option.textContent = task.text;
    select.appendChild(option);
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
    tasks = [];
    tabs = [
      { id: "tab_dumb", name: "DUMB STUFF" },
      { id: "tab_other", name: "OTHER STUFF" },
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
