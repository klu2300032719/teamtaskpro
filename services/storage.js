const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "db.json");

/* ---------------------------------------------
   Ensure the DB file exists
---------------------------------------------- */
function init() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify({ tasks: [], lastId: 0 }, null, 2)
    );
  }
}
init();

/* ---------------------------------------------
   Load DB
---------------------------------------------- */
function load() {
  const raw = fs.readFileSync(DB_FILE, "utf8");
  return JSON.parse(raw);
}

/* ---------------------------------------------
   Save DB
---------------------------------------------- */
function save(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

const storage = {};

/* ---------------------------------------------
   ADD TASK
---------------------------------------------- */
storage.add = async (task) => {
  const db = load();
  db.lastId += 1;

  const newTask = {
    id: db.lastId,
    title: task.title,
    assigned_to: task.assigned_to || null,
    status: task.status || "pending",
    priority: task.priority || "medium",
    due: task.due || null,
    comments: task.comments || [],
    subtasks: task.subtasks || [],
    parent: task.parent || null,
    deleted: false,
    created_at: new Date().toISOString(),
    completed_at: null,
    prev_status: task.prev_status || null
  };

  db.tasks.push(newTask);
  save(db);

  return newTask;
};

/* ---------------------------------------------
   GET BY ID
---------------------------------------------- */
storage.get = async (id) => {
  const db = load();
  return db.tasks.find((t) => t.id === id);
};

/* ---------------------------------------------
   UPDATE TASK
---------------------------------------------- */
storage.update = async (id, updates) => {
  const db = load();
  const idx = db.tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  db.tasks[idx] = { ...db.tasks[idx], ...updates };

  if (db.tasks[idx].status === "completed" && !db.tasks[idx].completed_at) {
    db.tasks[idx].completed_at = new Date().toISOString();
  }

  save(db);
  return db.tasks[idx];
};

/* ---------------------------------------------
   LIST ALL TASKS (non-deleted)
---------------------------------------------- */
storage.list = async () => {
  const db = load();
  return db.tasks.filter((t) => !t.deleted);
};

/* ---------------------------------------------
   HARD RESET — delete all tasks
---------------------------------------------- */
storage.reset = async () => {
  const empty = { tasks: [], lastId: 0 };
  save(empty);
  return true;
};

/* ---------------------------------------------
   Compute dashboard stats
---------------------------------------------- */
storage.stats = async () => {
  const db = load();
  const tasks = db.tasks || [];
  const now = new Date();

  let total = 0;
  let pending = 0;
  let completed = 0;
  let overdue = 0;

  for (const t of tasks) {
    if (t.deleted) continue;

    total++;

    if (t.status === "completed") completed++;
    else pending++;

    if (t.due) {
      const d = new Date(t.due);
      if (!isNaN(d) && d < now) overdue++;
    }
  }

  return { total, pending, completed, overdue };
};

module.exports = storage;
