/**
 * Dumbit - Productivity App
 * Main JavaScript file
 */

// Global state
let tasks = [];
let timerInterval = null;
let timeLeft = 25 * 60; // 25 minutes in seconds
let isRunning = false;
let stats = { completedTasks: 0, timerSessions: 0 };
let audioCtx = null;
let selectedTaskId = null;
let setFocusDialValues = null;

const CONFETTI_COLORS = {
  pg: ["#ff6ad5", "#caa7ff", "#65b8ff", "#ff9bde", "#9de8ff", "#ffffff"],
};

// UI Text Constants
const UI_TEXT = {
  TASK_PLACEHOLDER: "+ Add a new task",
  TASK_PLACEHOLDER_ERROR: "⚠️ Please enter a task",
  TITLE_MAIN: "DUMB STUFF",
  TITLE_SUB: "I GOTTA DO TODAY",
  DOC_TITLE: "Dumb Stuff I Gotta Do Today",
  TAGLINE: "Stay organized, be productive, you got this!",
};

document.addEventListener("DOMContentLoaded", () => {
  loadStats(); // Load stats first
  loadTabs();
  renderTaskTabs();
  initializeTasks();
  initializeTimer();
  initializeQuotes();
  initializeUtilityModals();
  initializeResetAll();
  initializePgMode();
  initializePrizeModal();
});

/**
 * Initialize task management system
 * Handles adding, deleting, and toggling tasks
 */
function initializeTasks() {
  const taskInput = document.getElementById("task-input");
  const addTaskBtn = document.getElementById("add-task-btn");
  const taskList = document.getElementById("task-list");

  // Add task on button click
  addTaskBtn.addEventListener("click", addTask);

  // Add task on Enter key press
  taskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addTask();
    }
  });

  // Load tasks from localStorage
  loadTasks();

  /**
   * Add a new task to the list
   */
  function addTask() {
    const taskText = taskInput.value.trim();

    if (taskText === "") {
      taskInput.classList.add("input-error");
      taskInput.placeholder = UI_TEXT.TASK_PLACEHOLDER_ERROR;
      setTimeout(() => {
        taskInput.classList.remove("input-error");
        taskInput.placeholder = UI_TEXT.TASK_PLACEHOLDER;
      }, 2000);
      return;
    }

    const task = {
      id: Date.now(),
      text: taskText,
      completed: false,
      tabId: activeTabId,
    };

    tasks.push(task);
    saveTasks();
    rerenderTaskList();

    taskInput.value = "";
    taskInput.focus();
  }

  /**
   * Render a single task to the DOM
   * @param {Object} task - The task object to render
   */
  function renderTask(task) {
    const li = document.createElement("li");
    li.className = "task-item";
    li.dataset.id = task.id;
    if (task.id === selectedTaskId) {
      li.classList.add("selected");
    }
    if (task.completed) {
      li.classList.add("completed");
    }

    // Create checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => toggleTask(task.id));

    // Create label
    const label = document.createElement("label");
    label.textContent = task.text;
    label.addEventListener("click", () => {
      selectedTaskId = task.id;
      rerenderTaskList();
      syncTaskTimerSelectionUI();
    });
    label.addEventListener("dblclick", () => {
      const next = prompt("Edit task:", task.text);
      if (!next) return;
      task.text = next.trim() || task.text;
      saveTasks();
      rerenderTaskList();
      renderCompletedByTab();
      syncTaskTimerSelectionUI();
    });

    // Create delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    // Assemble task item
    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(deleteBtn);

    taskList.appendChild(li);
  }

  function rerenderTaskList() {
    taskList.innerHTML = "";
    tasks
      .filter((t) => t.tabId === activeTabId && !t.completed)
      .forEach((task) => renderTask(task));
    updateTaskCount();
  }
  window.rerenderTaskList = rerenderTaskList;

  /**
   * Toggle task completion status
   * @param {number} taskId - The ID of the task to toggle
   */
  function toggleTask(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      const wasCompleted = task.completed;
      task.completed = !task.completed;

      // Update DOM
      const taskElement = document.querySelector(`[data-id="${taskId}"]`);
      if (taskElement) {
        taskElement.classList.toggle("completed", task.completed);
      }

      // Trigger confetti when task is completed (not uncompleted)
      if (!wasCompleted && task.completed) {
        celebrateByMode(2000);
        playModeSound("taskComplete");
        incrementCompletedTasks(); // Track stat
        showTaskCompletedNotification(); // Show quick notification
        updateTaskCount(); // Update task counter

        // Check if all tasks are now complete
        if (areAllTasksComplete()) {
          setTimeout(() => {
            showRewardModal(); // Show full reward modal only when all done
          }, 500);
        }
      } else if (wasCompleted && !task.completed) {
        // Task was uncompleted, update counter
        updateTaskCount();
      }

      saveTasks(); // Save to localStorage
      rerenderTaskList();
      renderCompletedByTab();
      syncTaskTimerSelectionUI();
    }
  }

  /**
   * Delete a task from the list
   * @param {number} taskId - The ID of the task to delete
   */
  function deleteTask(taskId) {
    tasks = tasks.filter((t) => t.id !== taskId);
    if (selectedTaskId === taskId) {
      selectedTaskId = null;
    }
    saveTasks();
    rerenderTaskList();
    renderCompletedByTab();
    syncTaskTimerSelectionUI();
  }

  /**
   * Update task count display
   */
  function updateTaskCount() {
    const currentTabTasks = tasks.filter((t) => t.tabId === activeTabId);
    const totalTasks = currentTabTasks.length;
    const completedTasks = currentTabTasks.filter((t) => t.completed).length;
    const taskCountEl = document.getElementById("taskCount");

    if (taskCountEl) {
      taskCountEl.textContent = `${completedTasks}/${totalTasks} completed`;
    }
  }

  /**
   * Load tasks from localStorage
   */
  function loadTasks() {
    const storageKey = getModeStorageKey();
    const savedTasks = localStorage.getItem(storageKey);
    if (savedTasks) {
      try {
        tasks = JSON.parse(savedTasks);
        tasks = tasks.map((task) => ({
          ...task,
          tabId: task.tabId || DEFAULT_TABS[0].id,
        }));
      } catch (error) {
        console.error("Error loading tasks:", error);
        tasks = [];
      }
    }
    if (selectedTaskId && !tasks.some((task) => task.id === selectedTaskId)) {
      selectedTaskId = null;
    }
    rerenderTaskList();
    renderCompletedByTab();
    syncTaskTimerSelectionUI();
  }

  /**
   * Save tasks to localStorage
   */
  function saveTasks() {
    try {
      const storageKey = getModeStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(tasks));
    } catch (error) {
      console.error("Error saving tasks:", error);
    }
  }
}

/**
 * Initialize timer functionality
 * Pomodoro-style focus timer with start/pause/reset controls
 */
function initializeTimer() {
  const startBtn = document.getElementById("start-btn");
  const pauseBtn = document.getElementById("pause-btn");
  const resetBtn = document.getElementById("reset-btn");
  const timerSection = document.querySelector(".timer-section");
  const hoursValueEl = document.getElementById("focusHoursValue");
  const minutesValueEl = document.getElementById("focusMinutesValue");
  const secondsValueEl = document.getElementById("focusSecondsValue");
  const hoursDecBtn = document.getElementById("focusHoursDec");
  const hoursIncBtn = document.getElementById("focusHoursInc");
  const minutesDecBtn = document.getElementById("focusMinutesDec");
  const minutesIncBtn = document.getElementById("focusMinutesInc");
  const secondsDecBtn = document.getElementById("focusSecondsDec");
  const secondsIncBtn = document.getElementById("focusSecondsInc");
  const steppers = document.querySelectorAll(".time-stepper");

  if (
    !startBtn ||
    !pauseBtn ||
    !resetBtn ||
    !timerSection ||
    !hoursValueEl ||
    !minutesValueEl ||
    !secondsValueEl ||
    !hoursDecBtn ||
    !hoursIncBtn ||
    !minutesDecBtn ||
    !minutesIncBtn ||
    !secondsDecBtn ||
    !secondsIncBtn
  ) {
    return;
  }

  const dialState = {
    hours: 0,
    minutes: 25,
    seconds: 0,
  };

  // Start button
  startBtn.addEventListener("click", startTimer);

  // Pause button
  pauseBtn.addEventListener("click", pauseTimer);

  // Reset button
  resetBtn.addEventListener("click", resetTimer);

  function clampWithWrap(value, max) {
    if (value < 0) return max;
    if (value > max) return 0;
    return value;
  }

  function renderDials() {
    hoursValueEl.textContent = `${dialState.hours}`.padStart(2, "0");
    minutesValueEl.textContent = `${dialState.minutes}`.padStart(2, "0");
    secondsValueEl.textContent = `${dialState.seconds}`.padStart(2, "0");
  }

  function readDialSeconds() {
    const hrs = dialState.hours || 0;
    const mins = dialState.minutes || 0;
    const secs = dialState.seconds || 0;
    return hrs * 3600 + mins * 60 + secs;
  }

  function setFromDials() {
    const next = readDialSeconds();
    timeLeft = next > 0 ? next : 25 * 60;
    updateDisplay();
  }

  function adjustDial(unit, delta) {
    const limits = { hours: 23, minutes: 59, seconds: 59 };
    dialState[unit] = clampWithWrap(dialState[unit] + delta, limits[unit]);
    renderDials();
    if (!isRunning) setFromDials();
  }

  function applyDialValues(hours, minutes, seconds) {
    dialState.hours = Math.min(23, Math.max(0, Number(hours) || 0));
    dialState.minutes = Math.min(59, Math.max(0, Number(minutes) || 0));
    dialState.seconds = Math.min(59, Math.max(0, Number(seconds) || 0));
    renderDials();
    if (!isRunning) setFromDials();
  }

  /**
   * Start the timer countdown
   */
  function startTimer() {
    if (!isRunning) {
      isRunning = true;
      timerSection.classList.add("timer-running");
      startBtn.disabled = true;
      pauseBtn.disabled = false;

      timerInterval = setInterval(() => {
        timeLeft--;
        updateDisplay();

        if (timeLeft <= 0) {
          timerComplete();
        }
      }, 1000);
    }
  }

  /**
   * Pause the timer
   */
  function pauseTimer() {
    if (isRunning) {
      isRunning = false;
      timerSection.classList.remove("timer-running");
      clearInterval(timerInterval);
      startBtn.disabled = false;
      pauseBtn.disabled = true;
    }
  }

  /**
   * Reset the timer to default (25 minutes)
   */
  function resetTimer() {
    pauseTimer();
    setFromDials();
  }

  /**
   * Update the timer display
   */
  function updateDisplay() {
    const hrs = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    const display =
      hrs > 0
        ? `${hrs.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        : `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    document.getElementById("time-left").textContent = display;
  }

  /**
   * Handle timer completion
   */
  function timerComplete() {
    pauseTimer();
    document.getElementById("timer-label").textContent = "Session Complete! 🎉";

    // Trigger confetti celebration
    celebrateByMode(3000);
    playModeSound("timerDone");

    // Track completed session
    incrementTimerSessions();

    // Show reward modal
    showRewardModal();
  }

  hoursDecBtn.addEventListener("click", () => adjustDial("hours", -1));
  hoursIncBtn.addEventListener("click", () => adjustDial("hours", 1));
  minutesDecBtn.addEventListener("click", () => adjustDial("minutes", -1));
  minutesIncBtn.addEventListener("click", () => adjustDial("minutes", 1));
  secondsDecBtn.addEventListener("click", () => adjustDial("seconds", -1));
  secondsIncBtn.addEventListener("click", () => adjustDial("seconds", 1));

  steppers.forEach((stepper) => {
    stepper.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        const unit = stepper.getAttribute("data-unit");
        if (!unit) return;
        adjustDial(unit, event.deltaY > 0 ? -1 : 1);
      },
      { passive: false },
    );
  });

  setFocusDialValues = applyDialValues;

  // Initialize display
  applyDialValues(0, 25, 0);
}

function formatFocusTimeDisplay(totalSeconds) {
  const seconds = Math.max(0, totalSeconds);
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return hrs > 0
    ? `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    : `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function refreshFocusTimerDisplay() {
  const timeLeftEl = document.getElementById("time-left");
  if (timeLeftEl) {
    timeLeftEl.textContent = formatFocusTimeDisplay(timeLeft);
  }
}

function getSelectedTask() {
  return tasks.find((task) => task.id === selectedTaskId) || null;
}

function setCompletedTitleForMode() {
  const completedTitle = document.getElementById("completedTitle");
  if (!completedTitle) return;
  completedTitle.textContent = "NEAT THINGS I GOT DONE TODAY";
}

function renderCompletedByTab() {
  const host = document.getElementById("completedByTab");
  if (!host) return;

  host.innerHTML = "";
  tabs.forEach((tab) => {
    const completed = tasks.filter(
      (task) => task.tabId === tab.id && task.completed,
    );

    const group = document.createElement("section");
    group.className = "completed-tab-group";

    const title = document.createElement("h4");
    title.textContent = tab.name;
    group.appendChild(title);

    if (completed.length === 0) {
      const empty = document.createElement("p");
      empty.className = "completed-tab-empty";
      empty.textContent = "No completed tasks yet.";
      group.appendChild(empty);
    } else {
      const list = document.createElement("ul");
      completed.forEach((task) => {
        const li = document.createElement("li");
        li.textContent = task.text;
        list.appendChild(li);
      });
      group.appendChild(list);
    }

    host.appendChild(group);
  });
}

function syncTaskTimerSelectionUI() {
  const focusTaskLineEl = document.getElementById("focusTaskLine");
  const task = getSelectedTask();

  const focusClockText = task
    ? `left to work on ${task.text}`
    : "left to work on your task";
  if (focusTaskLineEl) focusTaskLineEl.textContent = focusClockText;
}

function celebrateByMode(duration = 2500) {
  confetti.celebrate(duration, CONFETTI_COLORS.pg);
}

function playModeSound(type) {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const soundMap = {
      taskComplete: [880, 1046],
      timerDone: [988, 1318, 1760],
    };

    const sequence = soundMap[type] || [880];
    const now = audioCtx.currentTime;

    sequence.forEach((freq, index) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + index * 0.12);

      gain.gain.setValueAtTime(0.0001, now + index * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.06, now + index * 0.12 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.12 + 0.11);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + index * 0.12);
      osc.stop(now + index * 0.12 + 0.11);
    });
  } catch (error) {
    console.log("Audio playback skipped:", error.message);
  }
}

/**
 * Initialize motivational messages and activity suggestions
 * Uses Bored API for activity suggestions (no API key needed!)
 */
function initializeQuotes() {
  const fallbackMessages = [
    "Unicorn mission: finish one tiny task right now.",
    "Rainbow progress beats perfect plans every time.",
    "Small sparkle steps still count as big wins.",
    "Pick one task, finish it, then celebrate it.",
    "Gentle focus now gives future-you a gift.",
  ];

  const messageElement = document.getElementById("quote");
  if (!messageElement) return;

  async function fetchAffirmation() {
    try {
      const response = await fetch("https://www.affirmations.dev/");
      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();
      const affirmation = data?.affirmation;
      if (affirmation) {
        displayMessage(`Rainbow pep talk: ${affirmation}`);
        return;
      }
    } catch (error) {
      console.log("Affirmation API unavailable:", error.message);
    }
    throw new Error("No affirmation result");
  }

  async function fetchFunFact() {
    try {
      const response = await fetch(
        "https://uselessfacts.jsph.pl/api/v2/facts/random?language=en",
      );
      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();
      const fact = data?.text;
      if (fact) {
        displayMessage(`Fun fact: ${fact}`);
        return;
      }
    } catch (error) {
      console.log("Fun fact API unavailable:", error.message);
    }
    throw new Error("No fact result");
  }

  /**
   * Display message in footer
   */
  function displayMessage(text) {
    messageElement.textContent = text;
  }

  async function refreshQuote() {
    try {
      await fetchAffirmation();
      return;
    } catch (_) {
      // Fallback to another source
    }
    try {
      await fetchFunFact();
      return;
    } catch (_) {
      // Final local fallback
    }
    const randomMessage =
      fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
    displayMessage(randomMessage);
  }

  // Fetch initial message and refresh every 30 seconds
  refreshQuote();
  setInterval(refreshQuote, 30000);
}

/**
 * Fetch random GIF from GIPHY API
 * Used for reward modals after task completion or timer finish
 */
async function fetchRewardGif(searchTerm = "excited celebration") {
  // Check if config is available
  if (
    typeof CONFIG === "undefined" ||
    !CONFIG.GIPHY_API_KEY ||
    CONFIG.GIPHY_API_KEY === "YOUR_API_KEY_HERE"
  ) {
    console.log("GIPHY API key not configured, using fallback GIF");
    return null;
  }

  try {
    const endpoint = `https://api.giphy.com/v1/gifs/search`;
    const params = new URLSearchParams({
      api_key: CONFIG.GIPHY_API_KEY,
      q: searchTerm,
      limit: 25,
      rating: "g",
    });

    const response = await fetch(`${endpoint}?${params}`);

    if (!response.ok) {
      throw new Error("GIPHY API request failed");
    }

    const data = await response.json();

    if (data.data && data.data.length > 0) {
      // Pick a random GIF from results
      const randomIndex = Math.floor(Math.random() * data.data.length);
      const gif = data.data[randomIndex];
      return gif.images.original.url;
    }

    return null;
  } catch (error) {
    console.log("Error fetching GIPHY:", error.message);
    return null;
  }
}

/**
 * Load statistics from localStorage
 */
function loadStats() {
  const savedStats = localStorage.getItem("dumbit_stats");
  if (savedStats) {
    try {
      stats = JSON.parse(savedStats);
    } catch (error) {
      console.error("Error loading stats:", error);
      stats = { completedTasks: 0, timerSessions: 0 };
    }
  }
}

/**
 * Save statistics to localStorage
 */
function saveStats() {
  try {
    localStorage.setItem("dumbit_stats", JSON.stringify(stats));
  } catch (error) {
    console.error("Error saving stats:", error);
  }
}

/**
 * Increment completed tasks counter
 */
function incrementCompletedTasks() {
  stats.completedTasks++;
  saveStats();
  updateStatsDisplay();
}

/**
 * Increment timer sessions counter
 */
function incrementTimerSessions() {
  stats.timerSessions++;
  saveStats();
  updateStatsDisplay();
}

/**
 * Update statistics display
 */
function updateStatsDisplay() {
  const completedTasksEl = document.getElementById("statCompletedTasks");
  const timerSessionsEl = document.getElementById("statTimerSessions");

  if (completedTasksEl) {
    completedTasksEl.textContent = stats.completedTasks;
  }
  if (timerSessionsEl) {
    timerSessionsEl.textContent = stats.timerSessions;
  }
}

/* =====================================================
   PG MODE SETTINGS (single mode app)
===================================================== */

const STORAGE_KEY_PG = "dsigdt_tasks_pg";
const TAB_KEY_PG = "dsigdt_tabs_pg";
const ACTIVE_TAB_KEY_PG = "dsigdt_active_tab_pg";

const DEFAULT_TABS = [
  { id: "tab1", name: "DUE TODAY" },
  { id: "tab2", name: "NEXT UP" },
  { id: "tab3", name: "WHEN I CAN" },
  { id: "tab4", name: "DON'T FORGET" },
];

let tabs = [...DEFAULT_TABS];
let activeTabId = DEFAULT_TABS[0].id;

/**
 * Apply PG theme text
 * Async because it fetches a fresh GIF from GIPHY API for the reward modal
 */
async function applyThemeText() {
  const titleMain = document.getElementById("titleMain");
  if (titleMain) {
    titleMain.textContent = UI_TEXT.TITLE_MAIN;
  }

  const titleSub = document.getElementById("titleSub");
  if (titleSub) {
    titleSub.textContent = UI_TEXT.TITLE_SUB;
  }

  const tagline = document.getElementById("tagline");
  if (tagline) {
    tagline.textContent = UI_TEXT.TAGLINE;
  }

  const taskInput = document.getElementById("task-input");
  if (taskInput) {
    taskInput.placeholder = UI_TEXT.TASK_PLACEHOLDER;
  }

  document.title = UI_TEXT.DOC_TITLE;

  // Update prize modal content
  const prizeLine1 = document.getElementById("prizeLine1");
  const prizeLine2 = document.getElementById("prizeLine2");
  const prizeSubtitle = document.getElementById("prizeSubtitle");
  const prizeNote = document.getElementById("prizeNote");
  const nextTaskBtn = document.getElementById("nextTaskBtn");
  const addFiveMinBtn = document.getElementById("addFiveMinBtn");
  const prizeGif = document.getElementById("prizeGif");

  if (prizeLine1) prizeLine1.textContent = "GREAT JOB";
  if (prizeLine2) prizeLine2.textContent = "YOU'RE AMAZING!";
  if (prizeSubtitle) prizeSubtitle.textContent = "You earned a reward!";
  if (prizeNote) prizeNote.textContent = "or you can enjoy this cute cat!";
  if (nextTaskBtn) nextTaskBtn.textContent = "Next Task!";
  if (addFiveMinBtn) addFiveMinBtn.textContent = "Add 5 Min";

  const gifUrl = await fetchRewardGif("happy celebration cat");
  if (prizeGif) {
    prizeGif.src =
      gifUrl ||
      "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExbHBybnhveG4wdnRodGg2MnJ1NWhxNmxzcWV5Zm4weDcyZGFqMDV1cyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/75mBr8CLHect4tHlMb/giphy.gif";
  }

  const prizeList = document.getElementById("prizeList");
  if (prizeList) {
    prizeList.innerHTML = `
              <li>Go for a nice walk.</li>
              <li>Take a quick nap.</li>
              <li>Treat yourself to a snack!</li>
          `;
  }
}

/**
 * Get storage key for current mode
 */
function getModeStorageKey() {
  return STORAGE_KEY_PG;
}

function getTabStorageKey() {
  return TAB_KEY_PG;
}

function getActiveTabStorageKey() {
  return ACTIVE_TAB_KEY_PG;
}

function loadTabs() {
  const savedTabs = localStorage.getItem(getTabStorageKey());
  const savedActive = localStorage.getItem(getActiveTabStorageKey());
  tabs = savedTabs ? JSON.parse(savedTabs) : [...DEFAULT_TABS];
  activeTabId = savedActive || tabs[0].id;
}

function saveTabs() {
  localStorage.setItem(getTabStorageKey(), JSON.stringify(tabs));
  localStorage.setItem(getActiveTabStorageKey(), activeTabId);
}

function renderTaskTabs() {
  const tabsEl = document.getElementById("task-tabs");
  if (!tabsEl) return;

  tabsEl.innerHTML = "";
  tabs.forEach((tab) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `task-tab-btn ${tab.id === activeTabId ? "active" : ""}`;
    btn.textContent = tab.name;
    btn.addEventListener("click", () => {
      if (tab.id === activeTabId) {
        const next = prompt("Rename tab:", tab.name);
        if (!next) return;
        tab.name = next.trim() || tab.name;
        saveTabs();
        renderTaskTabs();
        renderCompletedByTab();
        syncTaskTimerSelectionUI();
        return;
      }

      activeTabId = tab.id;
      saveTabs();
      renderTaskTabs();
      if (typeof window.rerenderTaskList === "function") {
        window.rerenderTaskList();
      }
      syncTaskTimerSelectionUI();
    });
    tabsEl.appendChild(btn);
  });
}

/**
 * Switch PG mode
 */
function setPgMode() {
  document.body.classList.add("pg-mode");

  applyThemeText();
  setCompletedTitleForMode();
  loadTabs();
  renderTaskTabs();

  // Clear and reload tasks for new mode
  tasks = [];
  const taskList = document.getElementById("task-list");
  if (taskList) taskList.innerHTML = "";

  const savedTasks = localStorage.getItem(getModeStorageKey());
  if (savedTasks) {
    try {
      tasks = JSON.parse(savedTasks);
      tasks = tasks.map((task) => ({
        ...task,
        tabId: task.tabId || DEFAULT_TABS[0].id,
      }));
    } catch (e) {
      tasks = [];
    }
  }
  if (typeof window.rerenderTaskList === "function") {
    window.rerenderTaskList();
  }
  renderCompletedByTab();
  syncTaskTimerSelectionUI();
}

/**
 * Initialize PG mode
 */
function initializePgMode() {
  setPgMode();
}

function initializeUtilityModals() {
  const openAboutBtn = document.getElementById("openAboutBtn");
  const closeAboutBtn = document.getElementById("closeAboutBtn");
  const aboutOverlay = document.getElementById("aboutOverlay");

  if (openAboutBtn && aboutOverlay) {
    openAboutBtn.addEventListener("click", () =>
      aboutOverlay.classList.remove("is-hidden"),
    );
  }

  if (closeAboutBtn && aboutOverlay) {
    closeAboutBtn.addEventListener("click", () =>
      aboutOverlay.classList.add("is-hidden"),
    );
  }

  if (aboutOverlay) {
    aboutOverlay.addEventListener("click", (event) => {
      if (event.target === aboutOverlay) {
        aboutOverlay.classList.add("is-hidden");
      }
    });
  }
}

function initializeResetAll() {
  const openBtn = document.getElementById("resetAllBtn");
  const overlay = document.getElementById("resetConfirmOverlay");
  const closeBtn = document.getElementById("closeResetConfirmBtn");
  const cancelBtn = document.getElementById("cancelResetBtn");
  const confirmBtn = document.getElementById("confirmResetBtn");
  const taskInput = document.getElementById("task-input");
  const taskList = document.getElementById("task-list");
  const timerSection = document.querySelector(".timer-section");
  const startBtn = document.getElementById("start-btn");
  const pauseBtn = document.getElementById("pause-btn");
  const timerLabel = document.getElementById("timer-label");
  const focusTaskLine = document.getElementById("focusTaskLine");
  const timeLeftEl = document.getElementById("time-left");

  if (!openBtn || !overlay || !confirmBtn) return;

  function closeModal() {
    overlay.classList.add("is-hidden");
  }

  function openModal() {
    overlay.classList.remove("is-hidden");
  }

  function resetEverything() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    isRunning = false;
    timeLeft = 25 * 60;
    if (timerSection) timerSection.classList.remove("timer-running");
    if (startBtn) startBtn.disabled = false;
    if (pauseBtn) pauseBtn.disabled = true;
    if (timerLabel) timerLabel.textContent = "TIME";
    if (focusTaskLine) focusTaskLine.textContent = "left to work on your task";
    if (timeLeftEl) timeLeftEl.textContent = "25:00";
    if (typeof setFocusDialValues === "function") {
      setFocusDialValues(0, 25, 0);
    }

    tasks = [];
    selectedTaskId = null;
    tabs = [...DEFAULT_TABS];
    activeTabId = tabs[0].id;
    stats = { completedTasks: 0, timerSessions: 0 };

    localStorage.removeItem(STORAGE_KEY_PG);
    localStorage.removeItem(TAB_KEY_PG);
    localStorage.removeItem(ACTIVE_TAB_KEY_PG);
    localStorage.removeItem("dumbit_stats");

    renderTaskTabs();
    if (taskList) {
      taskList.innerHTML = "";
    }
    if (typeof window.rerenderTaskList === "function") {
      window.rerenderTaskList();
    }
    renderCompletedByTab();
    syncTaskTimerSelectionUI();
    updateStatsDisplay();

    if (taskInput) {
      taskInput.value = "";
      taskInput.placeholder = UI_TEXT.TASK_PLACEHOLDER;
    }

    closeModal();
    celebrateByMode(1400);
  }

  openBtn.addEventListener("click", openModal);
  confirmBtn.addEventListener("click", resetEverything);

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeModal();
  });
}

/* =====================================================
   REWARD MODAL FUNCTIONALITY
===================================================== */

/**
 * Check if all tasks are completed
 */
function areAllTasksComplete() {
  if (tasks.length === 0) return false; // No tasks, no reward
  return tasks.every((task) => task.completed);
}

/**
 * Show task completed notification
 */
function showTaskCompletedNotification() {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = "task-complete-notification";
  notification.innerHTML = `
        <div class="task-complete-card">
            <span class="task-complete-icon">✓</span>
            <span class="task-complete-text">Task completed!</span>
        </div>
    `;

  document.body.appendChild(notification);

  // Trigger animation
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  // Remove after animation
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 2000);
}

/**
 * Show reward modal with fresh GIF
 */
async function showRewardModal() {
  await loadFreshRewardGif();

  // Open the modal
  openPrizeModal();
}

/**
 * Load a fresh reward GIF and update modal content
 */
async function loadFreshRewardGif() {
  const prizeGif = document.getElementById("prizeGif");
  const prizeLine1 = document.getElementById("prizeLine1");
  const prizeLine2 = document.getElementById("prizeLine2");
  const prizeSubtitle = document.getElementById("prizeSubtitle");
  const prizeNote = document.getElementById("prizeNote");
  const nextTaskBtn = document.getElementById("nextTaskBtn");
  const addFiveMinBtn = document.getElementById("addFiveMinBtn");
  const prizeList = document.getElementById("prizeList");

  if (!prizeGif) return;

  // Show loading state
  prizeGif.style.opacity = "0.5";

  if (prizeLine1) prizeLine1.textContent = "GREAT JOB";
  // if (prizeLine2) prizeLine2.textContent = "YOU'RE AMAZING!";
  if (prizeSubtitle) prizeSubtitle.textContent = "You earned a reward!";
  if (prizeNote) prizeNote.textContent = "or you can enjoy this cute cat!";
  if (nextTaskBtn) nextTaskBtn.textContent = "Next Task!";
  if (addFiveMinBtn) addFiveMinBtn.textContent = "Add 5 Min";

  if (prizeList) {
    prizeList.innerHTML = `
              <li>Go for a nice walk.</li>
              <li>Take a quick nap.</li>
              <li>Treat yourself to a snack!</li>
          `;
  }

  const gifUrl = await fetchRewardGif("happy celebration cat cute");
  prizeGif.src =
    gifUrl ||
    "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExbHBybnhveG4wdnRodGg2MnJ1NWhxNmxzcWV5Zm4weDcyZGFqMDV1cyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/75mBr8CLHect4tHlMb/giphy.gif";

  // Wait for image to load
  prizeGif.onload = () => {
    prizeGif.style.opacity = "1";
  };
}

/**
 * Open reward modal when all tasks completed
 */
function openPrizeModal() {
  const overlay = document.getElementById("prizeOverlay");
  if (!overlay) return;
  overlay.classList.remove("is-hidden");
}

/**
 * Close reward modal
 */
function closePrizeModal() {
  const overlay = document.getElementById("prizeOverlay");
  if (!overlay) return;
  overlay.classList.add("is-hidden");
}

/**
 * Wire up prize modal event listeners
 */
function initializePrizeModal() {
  const overlay = document.getElementById("prizeOverlay");
  const closeBtn = document.getElementById("closePrizeX");
  const nextTaskBtn = document.getElementById("nextTaskBtn");
  const addFiveMinBtn = document.getElementById("addFiveMinBtn");

  if (closeBtn) {
    closeBtn.addEventListener("click", closePrizeModal);
  }

  if (nextTaskBtn) {
    nextTaskBtn.addEventListener("click", () => {
      closePrizeModal();
      const timerLabel = document.getElementById("timer-label");
      if (timerLabel) timerLabel.textContent = "TIME";
      const input = document.getElementById("task-input");
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  if (addFiveMinBtn) {
    addFiveMinBtn.addEventListener("click", () => {
      closePrizeModal();
      timeLeft = Math.max(0, timeLeft) + 5 * 60;
      refreshFocusTimerDisplay();
      const timerLabel = document.getElementById("timer-label");
      if (timerLabel) timerLabel.textContent = "TIME";
      if (!isRunning) {
        const startBtn = document.getElementById("start-btn");
        if (startBtn) startBtn.click();
      }
    });
  }

  // Click outside modal to close
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closePrizeModal();
    });
  }

  // ESC key to close
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePrizeModal();
  });
}
