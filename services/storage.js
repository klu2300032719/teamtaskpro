// services/storage.js
const fs = require("fs").promises;
const path = require("path");

const DB_FILE = path.join(__dirname, "..", "data", "tasks.json");

async function readDB() {
  try {
    const data = await fs.readFile(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") {
      return { lastId: 0, tasks: [] };
    }
    throw err;
  }
}

async function writeDB(db) {
  await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

async function list() {
  const db = await readDB();
  return db.tasks || [];
}

async function get(id) {
  const db = await readDB();
  return (db.tasks || []).find((t) => t.id === id) || null;
}

async function add(task) {
  const db = await readDB();
  const nextId = (db.lastId || 0) + 1;
  const newTask = { ...task, id: nextId };
  db.lastId = nextId;
  db.tasks = db.tasks || [];
  db.tasks.push(newTask);
  await writeDB(db);
  return newTask;
}

async function update(id, updatedTask) {
  const db = await readDB();
  db.tasks = db.tasks || [];
  const idx = db.tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  db.tasks[idx] = { ...db.tasks[idx], ...updatedTask, id };
  await writeDB(db);
  return db.tasks[idx];
}

async function reset() {
  const db = { lastId: 0, tasks: [] };
  await writeDB(db);
}

async function stats() {
  const tasks = await list();
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

    if (t.due && t.status !== "completed") {
      const d = new Date(t.due);
      if (d < now) overdue++;
    }
  }

  return { total, pending, completed, overdue };
}

async function exportCSV() {
  const tasks = await list();
  const headers = [
    "id",
    "title",
    "status",
    "priority",
    "assigned_to",
    "due",
    "deleted",
    "parent",
    "subtasks",
  ];

  const lines = [headers.join(",")];

  tasks.forEach((t) => {
    const row = [
      t.id,
      `"${(t.title || "").replace(/"/g, '""')}"`,
      t.status || "",
      t.priority || "",
      t.assigned_to || "",
      t.due || "",
      t.deleted ? "1" : "0",
      t.parent || "",
      (t.subtasks || []).join("|"),
    ];
    lines.push(row.join(","));
  });

  return lines.join("\n");
}

module.exports = {
  list,
  get,
  add,
  update,
  reset,
  stats,
  exportCSV,
};
