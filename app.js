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
const taskTimerState = {
  intervalId: null,
  remainingSeconds: 0,
  initialSeconds: 0,
  running: false,
  taskId: null,
};

const CONFETTI_COLORS = {
  pg: ["#ff6ad5", "#ffd93d", "#7bff8a", "#65b8ff", "#b28dff", "#ffffff"],
  shit: ["#d61f1f", "#8f0f0f", "#5a5a5a", "#2f2f2f", "#151515", "#b3b3b3"],
};

// UI Text Constants
const UI_TEXT = {
  SHIT_MODE: {
    TASK_PLACEHOLDER: "+ ADD MORE SHIT",
    TASK_PLACEHOLDER_ERROR: "⚠️ ADD SOME SHIT FIRST, DUH!",
    TITLE_MAIN: "DUMB SHIT",
    TITLE_SUB: "I GOTTA DO TODAY",
    DOC_TITLE: "Dumb Shit I Gotta Do Today",
    TAGLINE: "Stay focused, get shit done",
  },
  PG_MODE: {
    TASK_PLACEHOLDER: "+ Add a new task",
    TASK_PLACEHOLDER_ERROR: "⚠️ Please enter a task",
    TITLE_MAIN: "SILLY STUFF",
    TITLE_SUB: "I GOTTA DO TODAY",
    DOC_TITLE: "Silly Stuff I Gotta Do Today",
    TAGLINE: "Stay organized, be productive, you got this!",
  },
};

document.addEventListener("DOMContentLoaded", () => {
  loadStats(); // Load stats first
  loadTabs();
  renderTaskTabs();
  initializeTasks();
  initializeTimer();
  initializeQuotes();
  initializeTabRename();
  initializeUtilityModals();
  initializeTaskTimer();
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
      const errorPlaceholder = isPgMode
        ? UI_TEXT.PG_MODE.TASK_PLACEHOLDER_ERROR
        : UI_TEXT.SHIT_MODE.TASK_PLACEHOLDER_ERROR;
      const normalPlaceholder = isPgMode
        ? UI_TEXT.PG_MODE.TASK_PLACEHOLDER
        : UI_TEXT.SHIT_MODE.TASK_PLACEHOLDER;

      taskInput.classList.add("input-error");
      taskInput.placeholder = errorPlaceholder;
      setTimeout(() => {
        taskInput.classList.remove("input-error");
        taskInput.placeholder = normalPlaceholder;
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
  const presetBtns = document.querySelectorAll(".preset-btn");
  const timerSection = document.querySelector(".timer-section");
  const floatingClock = document.getElementById("focusFloatingClock");
  const floatingClockTime = document.getElementById("focusFloatingClockTime");

  // Start button
  startBtn.addEventListener("click", startTimer);

  // Pause button
  pauseBtn.addEventListener("click", pauseTimer);

  // Reset button
  resetBtn.addEventListener("click", resetTimer);

  // Preset buttons
  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!isRunning) {
        const minutes = parseInt(btn.dataset.minutes);
        setTimer(minutes);
      }
    });
  });

  /**
   * Start the timer countdown
   */
  function startTimer() {
    if (!isRunning) {
      isRunning = true;
      timerSection.classList.add("timer-running");
      startBtn.disabled = true;
      pauseBtn.disabled = false;
      if (floatingClock) floatingClock.classList.remove("is-hidden");
      if (floatingClockTime)
        floatingClockTime.textContent =
          document.getElementById("time-left").textContent;

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
      if (floatingClock) floatingClock.classList.add("is-hidden");
    }
  }

  /**
   * Reset the timer to default (25 minutes)
   */
  function resetTimer() {
    pauseTimer();
    setTimer(25);
  }

  /**
   * Set timer to specific number of minutes
   * @param {number} minutes - Number of minutes to set
   */
  function setTimer(minutes) {
    timeLeft = minutes * 60;
    updateDisplay();
  }

  /**
   * Update the timer display
   */
  function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const display = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    document.getElementById("time-left").textContent = display;
    if (floatingClockTime && isRunning) {
      floatingClockTime.textContent = display;
    }
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

    // Play completion notification (browser notification API could be added here)
    setTimeout(() => {
      document.getElementById("timer-label").textContent = "Focus Session";
      setTimer(25);
      if (floatingClock) floatingClock.classList.add("is-hidden");
    }, 3000);
  }

  // Initialize display
  updateDisplay();
}

function getSelectedTask() {
  return tasks.find((task) => task.id === selectedTaskId) || null;
}

function getTabNameById(tabId) {
  const tab = tabs.find((item) => item.id === tabId);
  return tab ? tab.name : "UNKNOWN";
}

function saveTasksForCurrentMode() {
  localStorage.setItem(getModeStorageKey(), JSON.stringify(tasks));
}

function setCompletedTitleForMode() {
  const completedTitle = document.getElementById("completedTitle");
  if (!completedTitle) return;
  completedTitle.textContent = isPgMode
    ? "NEAT THINGS I GOT DONE TODAY"
    : "SHIT I DID";
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

function formatSecondsToHms(totalSeconds) {
  const seconds = Math.max(0, totalSeconds);
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function syncTaskTimerSelectionUI() {
  const taskNameEl = document.getElementById("currentTaskName");
  const tabNameEl = document.getElementById("currentTabName");
  const floatingTaskEl = document.getElementById("floatingTimerTask");
  const doneTaskEl = document.getElementById("timerDoneTaskName");
  const task = getSelectedTask();

  if (tabNameEl) {
    tabNameEl.textContent = getTabNameById(activeTabId);
  }

  const selectedTaskText = task ? task.text : "Select a task first";
  if (taskNameEl) taskNameEl.textContent = selectedTaskText;
  if (floatingTaskEl) floatingTaskEl.textContent = selectedTaskText;
  if (doneTaskEl) doneTaskEl.textContent = selectedTaskText;
}

function initializeTaskTimer() {
  const overlay = document.getElementById("taskTimerOverlay");
  const closeBtn = document.getElementById("closeTaskTimerBtn");
  const openBtn = document.getElementById("openTaskTimerBtn");
  const doneOverlay = document.getElementById("timerCompleteOverlay");
  const doneYesBtn = document.getElementById("timerDoneYesBtn");
  const plusFiveBtn = document.getElementById("timerPlusFiveBtn");
  const floating = document.getElementById("floatingTimer");
  const floatingTime = document.getElementById("floatingTimerTime");

  const dialHours = document.getElementById("dialHours");
  const dialMinutes = document.getElementById("dialMinutes");
  const dialSeconds = document.getElementById("dialSeconds");

  const startBtn = document.getElementById("taskTimerStartBtn");
  const pauseBtn = document.getElementById("taskTimerPauseBtn");
  const resetBtn = document.getElementById("taskTimerResetBtn");

  if (
    !overlay ||
    !openBtn ||
    !closeBtn ||
    !doneOverlay ||
    !doneYesBtn ||
    !plusFiveBtn ||
    !floating ||
    !floatingTime ||
    !dialHours ||
    !dialMinutes ||
    !dialSeconds ||
    !startBtn ||
    !pauseBtn ||
    !resetBtn
  ) {
    return;
  }

  function setDialOptions(selectEl) {
    if (selectEl.options.length > 0) return;
    for (let i = 0; i <= 9; i += 1) {
      const option = document.createElement("option");
      option.value = `${i}`;
      option.textContent = `${i}`;
      selectEl.appendChild(option);
    }
  }

  function readDialSeconds() {
    const hrs = Number.parseInt(dialHours.value, 10) || 0;
    const mins = Number.parseInt(dialMinutes.value, 10) || 0;
    const secs = Number.parseInt(dialSeconds.value, 10) || 0;
    return hrs * 3600 + mins * 60 + secs;
  }

  function updateFloating() {
    floatingTime.textContent = formatSecondsToHms(
      taskTimerState.remainingSeconds,
    );
    syncTaskTimerSelectionUI();
  }

  function stopInterval() {
    if (taskTimerState.intervalId) {
      clearInterval(taskTimerState.intervalId);
    }
    taskTimerState.intervalId = null;
    taskTimerState.running = false;
    startBtn.textContent = "Start";
    pauseBtn.disabled = true;
  }

  function beginCountdown() {
    if (taskTimerState.remainingSeconds <= 0) {
      const fromDial = readDialSeconds();
      taskTimerState.remainingSeconds = fromDial;
      taskTimerState.initialSeconds = fromDial;
    }
    if (taskTimerState.remainingSeconds <= 0) {
      alert("Set the timer above zero.");
      return;
    }

    if (!taskTimerState.taskId) {
      alert("Select a task first.");
      return;
    }

    taskTimerState.running = true;
    startBtn.textContent = "Stop";
    pauseBtn.disabled = false;
    floating.classList.remove("is-hidden");
    updateFloating();

    taskTimerState.intervalId = setInterval(() => {
      taskTimerState.remainingSeconds -= 1;
      updateFloating();

      if (taskTimerState.remainingSeconds <= 0) {
        stopInterval();
        incrementTimerSessions();
        celebrateByMode(2500);
        playModeSound("timerDone");
        doneOverlay.classList.remove("is-hidden");
      }
    }, 1000);
  }

  function resetToInitial() {
    stopInterval();
    taskTimerState.remainingSeconds = taskTimerState.initialSeconds;
    updateFloating();
  }

  function markCurrentTaskDone() {
    const task = tasks.find((item) => item.id === taskTimerState.taskId);
    if (!task) return;
    if (!task.completed) {
      task.completed = true;
      incrementCompletedTasks();
      playModeSound("taskComplete");
      celebrateByMode(1800);
    }
    saveTasksForCurrentMode();
    if (typeof window.rerenderTaskList === "function") {
      window.rerenderTaskList();
    }
    renderCompletedByTab();
    selectedTaskId = null;
    syncTaskTimerSelectionUI();
    if (areAllTasksComplete()) {
      showRewardModal();
    }
  }

  setDialOptions(dialHours);
  setDialOptions(dialMinutes);
  setDialOptions(dialSeconds);
  dialHours.value = "0";
  dialMinutes.value = "2";
  dialSeconds.value = "5";
  taskTimerState.remainingSeconds = readDialSeconds();
  taskTimerState.initialSeconds = taskTimerState.remainingSeconds;
  updateFloating();

  openBtn.addEventListener("click", () => {
    const selected = getSelectedTask();
    if (!selected) {
      alert("Select a task first by clicking its text.");
      return;
    }
    taskTimerState.taskId = selected.id;
    syncTaskTimerSelectionUI();
    overlay.classList.remove("is-hidden");
  });

  closeBtn.addEventListener("click", () => {
    overlay.classList.add("is-hidden");
  });

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.classList.add("is-hidden");
  });

  startBtn.addEventListener("click", () => {
    if (taskTimerState.running) {
      stopInterval();
      taskTimerState.remainingSeconds = taskTimerState.initialSeconds;
      updateFloating();
      floating.classList.add("is-hidden");
      return;
    }
    beginCountdown();
  });

  pauseBtn.addEventListener("click", () => {
    stopInterval();
  });

  resetBtn.addEventListener("click", () => {
    taskTimerState.initialSeconds = readDialSeconds();
    resetToInitial();
  });

  [dialHours, dialMinutes, dialSeconds].forEach((selectEl) => {
    selectEl.addEventListener("change", () => {
      if (taskTimerState.running) return;
      taskTimerState.initialSeconds = readDialSeconds();
      taskTimerState.remainingSeconds = taskTimerState.initialSeconds;
      updateFloating();
    });
  });

  doneYesBtn.addEventListener("click", () => {
    doneOverlay.classList.add("is-hidden");
    markCurrentTaskDone();
    stopInterval();
    floating.classList.add("is-hidden");
    overlay.classList.add("is-hidden");
  });

  plusFiveBtn.addEventListener("click", () => {
    doneOverlay.classList.add("is-hidden");
    taskTimerState.remainingSeconds += 5 * 60;
    taskTimerState.initialSeconds = taskTimerState.remainingSeconds;
    updateFloating();
    beginCountdown();
  });

  doneOverlay.addEventListener("click", (event) => {
    if (event.target === doneOverlay) doneOverlay.classList.add("is-hidden");
  });
}

function celebrateByMode(duration = 2500) {
  const mode = isPgMode ? "pg" : "shit";
  confetti.celebrate(duration, CONFETTI_COLORS[mode]);
}

function playModeSound(type) {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const isPg = isPgMode;
    const soundMap = {
      taskComplete: isPg ? [880, 1046] : [220, 165],
      timerDone: isPg ? [988, 1318, 1760] : [180, 220, 140],
      modeSwitch: isPg ? [740, 988] : [196, 147],
    };

    const sequence = soundMap[type] || (isPg ? [880] : [180]);
    const now = audioCtx.currentTime;

    sequence.forEach((freq, index) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = isPg ? "triangle" : "square";
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
  const fallbackShitMode = [
    "Do one thing now. Stop negotiating with yourself.",
    "Small step. Right now. Momentum beats mood.",
    "You started this for a reason. Keep going.",
    "Pick the ugliest task and finish it first.",
    "Progress counts more than perfection today.",
  ];
  const fallbackPgMode = [
    "Fun fact: Tiny progress done daily compounds fast.",
    "Fun fact: Focus is easier when tasks are specific.",
    "Fun fact: Breaks help your brain retain more.",
    "Fun fact: Checking off one task boosts motivation.",
    "Fun fact: Consistency usually beats intensity.",
  ];

  const messageElement = document.getElementById("quote");
  if (!messageElement) return;

  async function fetchShitModeAdvice() {
    try {
      // CoinGecko API (no key)
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true",
      );
      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();
      const btc = data?.bitcoin?.usd;
      const eth = data?.ethereum?.usd;
      const btcChange = data?.bitcoin?.usd_24h_change;

      if (typeof btc === "number" && typeof eth === "number") {
        const vibe = btcChange >= 0 ? "up" : "down";
        displayMessage(
          `PUNK ECONOMY ${vibe}: BTC $${Math.round(btc).toLocaleString()} | ETH $${Math.round(eth).toLocaleString()} | Get your tasks done anyway.`,
        );
        return;
      }
    } catch (error) {
      console.log("Using SHIT mode fallback message:", error.message);
    }

    const randomMessage =
      fallbackShitMode[Math.floor(Math.random() * fallbackShitMode.length)];
    displayMessage(randomMessage);
  }
  async function fetchPgModeFact() {
    try {
      // Useless Facts API (no key)
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
      console.log("Using PG mode fallback message:", error.message);
    }

    const randomMessage =
      fallbackPgMode[Math.floor(Math.random() * fallbackPgMode.length)];
    displayMessage(randomMessage);
  }

  /**
   * Display message in footer
   */
  function displayMessage(text) {
    messageElement.textContent = text;
  }

  async function refreshQuoteByMode() {
    if (isPgMode) {
      await fetchPgModeFact();
      return;
    }
    await fetchShitModeAdvice();
  }

  // Expose refresh function so mode switch can update immediately
  window.refreshQuoteGlobal = refreshQuoteByMode;

  // Fetch initial message and refresh every 30 seconds
  refreshQuoteByMode();
  setInterval(refreshQuoteByMode, 30000);
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
   PG MODE TOGGLE FUNCTIONALITY
   Switches between $H!T MODE and PG MODE
   - Different text/language for each mode
   - Separate task storage per mode
   - Visual theme changes
===================================================== */

const STORAGE_KEY_SHIT = "dsigdt_tasks_shit";
const STORAGE_KEY_PG = "dsigdt_tasks_pg";
const PG_MODE_KEY = "dsigdt_pg_mode";
const TAB_KEY_SHIT = "dsigdt_tabs_shit";
const TAB_KEY_PG = "dsigdt_tabs_pg";
const ACTIVE_TAB_KEY_SHIT = "dsigdt_active_tab_shit";
const ACTIVE_TAB_KEY_PG = "dsigdt_active_tab_pg";

const DEFAULT_TABS = [
  { id: "tab1", name: "DUE TODAY" },
  { id: "tab2", name: "NEXT UP" },
  { id: "tab3", name: "WHEN I CAN" },
  { id: "tab4", name: "DON'T FORGET" },
];

let isPgMode = false;
let tabs = [...DEFAULT_TABS];
let activeTabId = DEFAULT_TABS[0].id;

/**
 * Apply theme text for current mode
 * Updates UI text elements based on PG/Shit mode
 * Async because it fetches a fresh GIF from GIPHY API for the reward modal
 */
async function applyThemeText(mode) {
  const modeText = mode === "pg" ? UI_TEXT.PG_MODE : UI_TEXT.SHIT_MODE;

  const titleMain = document.getElementById("titleMain");
  if (titleMain) {
    titleMain.textContent = modeText.TITLE_MAIN;
  }

  const titleSub = document.getElementById("titleSub");
  if (titleSub) {
    titleSub.textContent = modeText.TITLE_SUB;
  }

  const tagline = document.getElementById("tagline");
  if (tagline) {
    tagline.textContent = modeText.TAGLINE;
  }

  const taskInput = document.getElementById("task-input");
  if (taskInput) {
    taskInput.placeholder = modeText.TASK_PLACEHOLDER;
  }

  document.title = modeText.DOC_TITLE;

  // Update prize modal content
  const prizeLine1 = document.getElementById("prizeLine1");
  const prizeLine2 = document.getElementById("prizeLine2");
  const prizeSubtitle = document.getElementById("prizeSubtitle");
  const prizeNote = document.getElementById("prizeNote");
  const backToItBtn = document.getElementById("backToItBtn");
  const prizeGif = document.getElementById("prizeGif");

  if (mode === "pg") {
    if (prizeLine1) prizeLine1.textContent = "GREAT JOB";
    if (prizeLine2) prizeLine2.textContent = "SUPERSTAR!";
    if (prizeSubtitle) prizeSubtitle.textContent = "You earned a reward!";
    if (prizeNote) prizeNote.textContent = "or you can enjoy this cute cat!";
    if (backToItBtn) backToItBtn.textContent = "KEEP GOING, YOU'RE AMAZING!";

    // Try to fetch a GIF from GIPHY, fallback to static if unavailable
    const gifUrl = await fetchRewardGif("happy celebration cat");
    if (prizeGif) {
      prizeGif.src =
        gifUrl ||
        "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExbHBybnhveG4wdnRodGg2MnJ1NWhxNmxzcWV5Zm4weDcyZGFqMDV1cyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/75mBr8CLHect4tHlMb/giphy.gif";
    }

    // Update prize list
    const prizeList = document.getElementById("prizeList");
    if (prizeList) {
      prizeList.innerHTML = `
                <li>Go for a nice walk.</li>
                <li>Take a quick nap.</li>
                <li>Treat yourself to a snack!</li>
            `;
    }
  } else {
    if (prizeLine1) prizeLine1.textContent = "GOOD JOB";
    if (prizeLine2) prizeLine2.textContent = "DUMMY!";
    if (prizeSubtitle) prizeSubtitle.textContent = "PICK A PRIZE";
    if (prizeNote)
      prizeNote.textContent = "or you can stare at this cute dumb cat";
    if (backToItBtn) backToItBtn.textContent = "NOW GET BACK TO WORK!";

    // Try to fetch a GIF from GIPHY, fallback to static if unavailable
    const gifUrl = await fetchRewardGif("hell yeah you did it");
    if (prizeGif) {
      prizeGif.src =
        gifUrl || "https://media.giphy.com/media/uF4QwYRpMDuGuMXL1G/giphy.gif";
    }

    // Update prize list
    const prizeList = document.getElementById("prizeList");
    if (prizeList) {
      prizeList.innerHTML = `
                <li>GO FOR A WALK.</li>
                <li>TAKE A QUICK NAP.</li>
                <li>GO GET YOUR PRODUCTIVE ASS SOME SKITTLES.</li>
            `;
    }
  }
}

/**
 * Get storage key for current mode
 */
function getModeStorageKey() {
  return isPgMode ? STORAGE_KEY_PG : STORAGE_KEY_SHIT;
}

function getTabStorageKey() {
  return isPgMode ? TAB_KEY_PG : TAB_KEY_SHIT;
}

function getActiveTabStorageKey() {
  return isPgMode ? ACTIVE_TAB_KEY_PG : ACTIVE_TAB_KEY_SHIT;
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
      activeTabId = tab.id;
      saveTabs();
      renderTaskTabs();
      if (typeof window.rerenderTaskList === "function") {
        window.rerenderTaskList();
      }
      syncTaskTimerSelectionUI();
    });
    btn.addEventListener("dblclick", () => {
      const next = prompt("Rename tab:", tab.name);
      if (!next) return;
      tab.name = next.trim() || tab.name;
      saveTabs();
      renderTaskTabs();
      renderCompletedByTab();
      syncTaskTimerSelectionUI();
    });
    tabsEl.appendChild(btn);
  });
}
function initializeTabRename() {
  const btn = document.getElementById("rename-tab-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const tab = tabs.find((t) => t.id === activeTabId);
    if (!tab) return;
    const next = prompt("Rename tab:", tab.name);
    if (!next) return;
    tab.name = next.trim() || tab.name;
    saveTabs();
    renderTaskTabs();
    renderCompletedByTab();
    syncTaskTimerSelectionUI();
  });
}

/**
 * Switch PG mode
 */
function setPgMode(pgMode) {
  isPgMode = pgMode;
  const mode = pgMode ? "pg" : "shit";

  document.body.classList.toggle("pg-mode", pgMode);

  const label = document.getElementById("pgLabel");
  if (label) label.textContent = pgMode ? "PG MODE" : "$H!T MODE";

  const toggle = document.getElementById("pgToggle");
  if (toggle) toggle.checked = !pgMode;

  applyThemeText(mode);
  setCompletedTitleForMode();
  playModeSound("modeSwitch");
  localStorage.setItem(PG_MODE_KEY, pgMode ? "1" : "0");
  if (window.refreshQuoteGlobal) {
    window.refreshQuoteGlobal();
  }
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
  const savedPg = localStorage.getItem(PG_MODE_KEY);
  const startInPgMode = savedPg === "1";

  const pgToggle = document.getElementById("pgToggle");
  if (pgToggle) {
    pgToggle.addEventListener("change", () => {
      setPgMode(!pgToggle.checked);
    });
  }

  setPgMode(startInPgMode);
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
  // Load a fresh GIF based on current mode
  const mode = isPgMode ? "pg" : "shit";
  await loadFreshRewardGif(mode);

  // Open the modal
  openPrizeModal();
}

/**
 * Load a fresh reward GIF and update modal content for the current mode
 */
async function loadFreshRewardGif(mode) {
  const prizeGif = document.getElementById("prizeGif");
  const prizeLine1 = document.getElementById("prizeLine1");
  const prizeLine2 = document.getElementById("prizeLine2");
  const prizeSubtitle = document.getElementById("prizeSubtitle");
  const prizeNote = document.getElementById("prizeNote");
  const backToItBtn = document.getElementById("backToItBtn");
  const prizeList = document.getElementById("prizeList");

  if (!prizeGif) return;

  // Show loading state
  prizeGif.style.opacity = "0.5";

  if (mode === "pg") {
    // Update text for PG mode
    if (prizeLine1) prizeLine1.textContent = "GREAT JOB";
    if (prizeLine2) prizeLine2.textContent = "SUPERSTAR!";
    if (prizeSubtitle) prizeSubtitle.textContent = "You earned a reward!";
    if (prizeNote) prizeNote.textContent = "or you can enjoy this cute cat!";
    if (backToItBtn) backToItBtn.textContent = "KEEP GOING, YOU'RE AMAZING!";

    // Update prize list for PG mode
    if (prizeList) {
      prizeList.innerHTML = `
                <li>Go for a nice walk.</li>
                <li>Take a quick nap.</li>
                <li>Treat yourself to a snack!</li>
            `;
    }

    // Fetch fresh cat GIF for PG mode
    const gifUrl = await fetchRewardGif("happy celebration cat cute");
    prizeGif.src =
      gifUrl ||
      "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExbHBybnhveG4wdnRodGg2MnJ1NWhxNmxzcWV5Zm4weDcyZGFqMDV1cyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/75mBr8CLHect4tHlMb/giphy.gif";
  } else {
    // Update text for Shit mode
    if (prizeLine1) prizeLine1.textContent = "GOOD JOB";
    if (prizeLine2) prizeLine2.textContent = "DUMMY!";
    if (prizeSubtitle) prizeSubtitle.textContent = "PICK A PRIZE";
    if (prizeNote)
      prizeNote.textContent = "or you can stare at this cute dumb cat";
    if (backToItBtn) backToItBtn.textContent = "NOW GET BACK TO WORK!";

    // Update prize list for Shit mode
    if (prizeList) {
      prizeList.innerHTML = `
                <li>GO FOR A WALK.</li>
                <li>TAKE A QUICK NAP.</li>
                <li>GO GET YOUR PRODUCTIVE ASS SOME SKITTLES.</li>
            `;
    }

    // Fetch fresh cat GIF for Shit mode
    const gifUrl = await fetchRewardGif("hell yeah you did it cat");
    prizeGif.src =
      gifUrl || "https://media.giphy.com/media/uF4QwYRpMDuGuMXL1G/giphy.gif";
  }

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
  const backBtn = document.getElementById("backToItBtn");

  if (closeBtn) {
    closeBtn.addEventListener("click", closePrizeModal);
  }

  if (backBtn) {
    backBtn.addEventListener("click", closePrizeModal);
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
