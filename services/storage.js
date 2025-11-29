const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "tasks.json");

function load() {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function save(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = {
  async list() {
    return load().filter(t => !t.deleted);
  },

  async add(task) {
    const tasks = load();
    task.id = tasks.length ? tasks[tasks.length - 1].id + 1 : 1;
    tasks.push(task);
    save(tasks);
    return task;
  },

  async get(id) {
    return load().find(t => t.id === id);
  },

  async update(id, updated) {
    const tasks = load();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      tasks[idx] = updated;
      save(tasks);
    }
  },

  async reset() {
    save([]);
  },

  async stats() {
    const tasks = load().filter(t => !t.deleted);
    const now = new Date();

    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === "pending").length,
      completed: tasks.filter(t => t.status === "completed").length,
      overdue: tasks.filter(t => t.due && new Date(t.due) < now && t.status !== "completed").length
    };
  },

  async exportCSV() {
    const tasks = load();
    let csv = "id,title,status,priority,assigned_to,due\n";
    tasks.forEach(t => {
      csv += `${t.id},"${t.title}",${t.status},${t.priority},${t.assigned_to},${t.due}\n`;
    });
    return csv;
  }
};
