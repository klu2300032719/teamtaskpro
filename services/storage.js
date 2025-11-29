// services/storage.js
const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "../data/tasks.json");

function load() {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function save(tasks) {
  fs.writeFileSync(FILE, JSON.stringify(tasks, null, 2));
}

module.exports = {
  async list() {
    return load().filter(t => !t.deleted);
  },

  async get(id) {
    return load().find(t => t.id === id);
  },

  async add(task) {
    const tasks = load();
    task.id = tasks.length ? tasks[tasks.length - 1].id + 1 : 1;
    tasks.push(task);
    save(tasks);
    return task;
  },

  async update(id, updated) {
    const tasks = load();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) tasks[idx] = updated;
    save(tasks);
  },

  async stats() {
    const tasks = load();
    const now = new Date();
    const isOverdue = t => t.due && new Date(t.due) < now && t.status !== "completed";

    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === "pending").length,
      completed: tasks.filter(t => t.status === "completed").length,
      overdue: tasks.filter(isOverdue).length
    };
  },

  async exportCSV() {
    const tasks = load();
    const headers = "id,title,status,assigned_to,priority,due,parent,subtasks";
    return [headers, ...tasks.map(t =>
      `${t.id},"${t.title}",${t.status},${t.assigned_to},${t.priority},${t.due},${t.parent},${(t.subtasks || []).join("|")}`
    )].join("\n");
  },

  async reset() {
    save([]);
  }
};
