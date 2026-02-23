let tasks = [];

document.addEventListener("DOMContentLoaded", () => {
  loadTasks();
  initializeTasks();
  loadQuote();
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
