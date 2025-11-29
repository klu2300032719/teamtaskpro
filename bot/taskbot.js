const storage = require("../services/storage");
const taskbot = {};
const ADMINS = ["hemavarshiniramesh", "admin", "owner"];

function addHistory(task, action, details, actor) {
  task.history = task.history || [];
  task.history.push({ action, details, actor, time: new Date().toISOString() });
}

function formatTask(task) {
  return [
    `#${task.id} — ${task.title}`,
    `Status: ${task.status}`,
    `Priority: ${task.priority}`,
    `Assigned: ${task.assigned_to || "Unassigned"}`,
    `Due: ${task.due || "—"}`,
    `Subtasks: ${task.subtasks?.length ? task.subtasks.join(", ") : "None"}`
  ].join("\n");
}

taskbot.dispatch = async (command, sender) => {
  if (!command) return { ok: false, message: "Empty command." };
  const parts = command.trim().split(" ");
  const root = parts[0].toLowerCase();

  switch (root) {
    case "/help":
      return { ok: true, message: "📌 Commands:\n/addtask\n/complete\n/undo\n/delete\n/assign\n/priority\n/due\n/info\n/stats\n/search\n/completeall\n/export\n/resetall (admin)" };

    case "/stats":
      return { ok: true, stats: await storage.stats() };

    case "/addtask": {
      const title = parts.slice(1).join(" ");
      const task = await storage.add({
        title, assigned_to: sender, status: "pending",
        priority: "medium", due: null, comments: [], subtasks: [], parent: null, deleted: false
      });
      addHistory(task, "created", `"${title}"`, sender);
      await storage.update(task.id, task);
      return { ok: true, message: `Added #${task.id}`, task };
    }

    case "/complete": {
      const id = parseInt(parts[1]);
      const task = await storage.get(id);
      task.prev_status = task.status;
      task.status = "completed";
      task.completed_at = new Date().toISOString();
      addHistory(task, "complete", "", sender);
      await storage.update(id, task);
      return { ok: true, message: `Completed #${id}` };
    }

    case "/undo": {
      const id = parseInt(parts[1]);
      const task = await storage.get(id);
      task.status = task.prev_status || "pending";
      task.prev_status = null;
      addHistory(task, "undo", "", sender);
      await storage.update(id, task);
      return { ok: true, message: `Undo complete #${id}` };
    }

    case "/info":
      return { ok: true, message: formatTask(await storage.get(parseInt(parts[1]))) };

    default:
      return { ok: false, message: "Unknown command" };
  }
};

module.exports = taskbot;
