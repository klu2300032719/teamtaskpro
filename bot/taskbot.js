// bot/taskbot.js
const storage = require("../services/storage");

const taskbot = {};

const ADMINS = ["hemavarshiniramesh", "admin", "owner"]; // add more usernames if needed

function todayString() {
  return new Date().toLocaleString();
}

function addHistory(task, action, details, actor) {
  task.history = task.history || [];
  task.history.push({
    action,
    details,
    actor: actor || "system",
    time: new Date().toISOString()
  });
}

function formatTask(task) {
  if (!task) return "Task not found.";
  return [
    `#${task.id} — ${task.title}`,
    `Status: ${task.status}`,
    `Priority: ${task.priority || "medium"}`,
    `Assigned to: ${task.assigned_to || "Unassigned"}`,
    `Due: ${task.due || "—"}`,
    `Parent: ${task.parent || "—"}`,
    `Subtasks: ${task.subtasks && task.subtasks.length ? task.subtasks.join(", ") : "None"}`
  ].join("\n");
}

/* ---------------------------------------------------
   COMMAND DISPATCHER
----------------------------------------------------- */
taskbot.dispatch = async (command, sender) => {
  if (!command) return { ok: false, message: "Empty command." };

  const parts = command.trim().split(" ");
  const root = parts[0].toLowerCase();

  switch (root) {
    case "/help": {
      return {
        ok: true,
        message:
          "📌 **Available Commands**\n\n" +
          "/addtask <title>\n" +
          "/smarttask <title>\n" +
          "/assign <id> <user>\n" +
          "/comment <id> <text>\n" +
          "/start <id>\n" +
          "/complete <id>\n" +
          "/undo <id>\n" +
          "/delete <id>\n" +
          "/rename <id> <new title>\n" +
          "/priority <id> <low|medium|high|critical>\n" +
          "/due <id> <YYYY-MM-DD>\n" +
          "/info <id>\n" +
          "/whoisbusy\n" +
          "/duein <days>\n" +
          "/overdue\n" +
          "/stats\n" +
          "/completeall\n" +
          "/export\n" +
          "/search <filters>\n" +
          "/history <id>\n" +
          "/resetall  (admin only)\n" +
          "/confirmreset  (admin only)\n"
      };
    }
