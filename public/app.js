let tasks = [];
let chart = null;

// reminder popup msgs
const reminderMessages = [
  "Unclench your jaw! 💜",
  "Drink some water! 💧",
  "Take a deep breath! 🌬️",
  "Get yourself a snack! 🥤🥗🍔🍟",
  "Stretch your shoulders! 🙆",
  "Check your posture! ⬆️",
];

document.addEventListener("DOMContentLoaded", () => {
  loadTasks();
  initializeTasks();
  loadQuote();
  initializeReminders();
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
    if (confirm("🧨 💣 Reset All STUFF? 💣 🧨")) {
      tasks = [];
      saveTasks();
      renderTasks();
    }
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
  };

  tasks.push(task);
  saveTasks();
  renderTasks();
  input.value = "";
}

// render tasks to page
function renderTasks() {
  const list = document.getElementById("task-list");
  list.innerHTML = "";

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = task.completed ? "task-item completed" : "task-item";

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
}

// toggle + delete + save + load
function toggleTask(id) {
  tasks = tasks.map((task) => {
    if (task.id === id) {
      return { ...task, completed: !task.completed };
    }
    return task;
  });
  saveTasks();
  renderTasks();
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
    const response = await fetch("https://www.affirmations.dev/");
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

  // show random reminder every X secs, FIX4
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
      labels: ["Done", "Still to do"],
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
