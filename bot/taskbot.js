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
    time: new Date().toISOString(),
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
    `Subtasks: ${
      task.subtasks && task.subtasks.length
        ? task.subtasks.join(", ")
        : "None"
    }`,
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
    /* ===========================================================
       /help  → List all commands
    ============================================================ */
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
          "/list\n" +
          "/pending\n" +
          "/completed\n" +
          "/whoisbusy\n" +
          "/duein <days>\n" +
          "/overdue\n" +
          "/stats\n" +
          "/completeall\n" +
          "/export\n" +
          "/search <filters>\n" +
          "/history <id>\n" +
          "/resetall  (admin only)\n" +
          "/confirmreset  (admin only)\n",
      };
    }

    /* ===========================================================
       /stats → dashboard summary
    ============================================================ */
    case "/stats": {
      const stats = await storage.stats();
      return {
        ok: true,
        message:
          `📊 **Task Summary**\n\n` +
          `Total: ${stats.total}\n` +
          `Pending: ${stats.pending}\n` +
          `Completed: ${stats.completed}\n` +
          `Overdue: ${stats.overdue}`,
      };
    }

    /* ===========================================================
       /list → show all NON-DELETED tasks (with status)
    ============================================================ */
    case "/list":
    case "/pending": {
      const tasks = await storage.list();
      const pending = tasks.filter(
        (t) => !t.deleted && t.status !== "completed"
      );

      if (!pending.length) {
        return { ok: true, message: "No pending tasks." };
      }

      const lines = pending.map(
        (t) =>
          `#${t.id} - ${t.title} [${t.status}, ${t.priority || "medium"}, ${
            t.assigned_to || "Unassigned"
          }]`
      );

      return {
        ok: true,
        message: "📋 **Pending / Active tasks:**\n" + lines.join("\n"),
        tasks: pending,
      };
    }

    /* ===========================================================
       /completed → show completed tasks
    ============================================================ */
    case "/completed": {
      const tasks = await storage.list();
      const done = tasks.filter(
        (t) => !t.deleted && t.status === "completed"
      );

      if (!done.length) {
        return { ok: true, message: "No completed tasks." };
      }

      const lines = done.map(
        (t) =>
          `#${t.id} - ${t.title} [completed by ${
            t.assigned_to || "someone"
          }]`
      );

      return {
        ok: true,
        message: "✅ **Completed Tasks:**\n" + lines.join("\n"),
        tasks: done,
      };
    }

    /* ===========================================================
       /addtask TITLE
    ============================================================ */
    case "/addtask": {
      const title = parts.slice(1).join(" ");
      if (!title) return { ok: false, message: "Usage: /addtask <title>" };

      let priority = "medium";
      const t = title.toLowerCase();

      if (t.includes("urgent") || t.includes("asap") || t.includes("critical"))
        priority = "high";
      else if (t.includes("optional") || t.includes("later"))
        priority = "low";

      const task = await storage.add({
        title,
        assigned_to: sender,
        status: "pending",
        priority,
        due: null,
        comments: [],
        subtasks: [],
        parent: null,
        deleted: false,
        prev_status: null,
        history: [],
      });

      addHistory(task, "created", `Task created with title "${title}"`, sender);
      await storage.update(task.id, task);

      return { ok: true, message: `Task added (#${task.id}): ${title}`, task };
    }

    /* ===========================================================
       /smarttask TITLE
       Auto-create 4 subtasks (Research → Plan → Draft → Finalize)
    ============================================================ */
    case "/smarttask": {
      const title = parts.slice(1).join(" ");
      if (!title) return { ok: false, message: "Usage: /smarttask <title>" };

      const now = new Date();
      const due = new Date();
      due.setDate(now.getDate() + 7);

      const parent = await storage.add({
        title,
        assigned_to: sender,
        status: "pending",
        priority: "high",
        due: due.toISOString(),
        comments: [],
        subtasks: [],
        parent: null,
        deleted: false,
        prev_status: null,
        history: [],
      });

      addHistory(parent, "created", "Smart task parent created", sender);

      const steps = [
        { label: "Research", assignee: "partner" },
        { label: "Plan", assignee: "varshini" },
        { label: "Draft", assignee: "rahul" },
        { label: "Finalize", assignee: sender },
      ];

      const subtasks = [];

      for (const s of steps) {
        const sub = await storage.add({
          title: `${s.label}: ${title}`,
          assigned_to: s.assignee,
          status: "pending",
          priority: "medium",
          due: due.toISOString(),
          comments: [],
          subtasks: [],
          parent: parent.id,
          deleted: false,
          prev_status: null,
          history: [],
        });
        addHistory(sub, "created", `Subtask for ${s.label}`, sender);
        parent.subtasks.push(sub.id);
        subtasks.push(sub);
      }

      await storage.update(parent.id, parent);

      return {
        ok: true,
        message: `Smart task created: ${title} with 4 subtasks`,
        parent,
        subtasks,
      };
    }

    /* ===========================================================
       /complete ID
    ============================================================ */
    case "/complete": {
      const id = parseInt(parts[1]);
      if (!id) return { ok: false, message: "Usage: /complete <id>" };

      const task = await storage.get(id);
      if (!task || task.deleted)
        return { ok: false, message: "Task not found." };

      task.prev_status = task.status;
      task.status = "completed";
      task.completed_at = new Date().toISOString();
      addHistory(task, "completed", "Task marked completed", sender);

      await storage.update(id, task);
      return { ok: true, message: `Task #${id} marked complete.` };
    }

    /* ===========================================================
       /undo ID → Completed → previous status
    ============================================================ */
    case "/undo": {
      const id = parseInt(parts[1]);
      if (!id) return { ok: false, message: "Usage: /undo <id>" };

      const task = await storage.get(id);
      if (!task) return { ok: false, message: "Task not found." };

      if (task.status !== "completed")
        return { ok: false, message: "This task is not completed." };

      task.status = task.prev_status || "pending";
      task.prev_status = null;
      task.completed_at = null;
      addHistory(task, "undo", "Completion undone", sender);

      await storage.update(id, task);
      return { ok: true, message: `Task #${id} restored.` };
    }

    /* ===========================================================
       /start ID
    ============================================================ */
    case "/start": {
      const id = parseInt(parts[1]);
      if (!id) return { ok: false, message: "Usage: /start <id>" };

      const task = await storage.get(id);
      if (!task) return { ok: false, message: "Task not found." };

      task.prev_status = task.status;
      task.status = "in-progress";
      addHistory(task, "start", "Task started", sender);

      await storage.update(id, task);
      return { ok: true, message: `Task #${id} started.` };
    }

    /* ===========================================================
       /delete ID  (soft delete)
    ============================================================ */
    case "/delete": {
      const id = parseInt(parts[1]);
      if (!id) return { ok: false, message: "Usage: /delete <id>" };

      const task = await storage.get(id);
      if (!task) return { ok: false, message: "Task not found." };

      task.deleted = true;
      addHistory(task, "deleted", "Task soft deleted", sender);
      await storage.update(id, task);

      return { ok: true, message: `Task #${id} deleted.` };
    }

    /* ===========================================================
       /rename ID NEW TITLE
    ============================================================ */
    case "/rename": {
      const id = parseInt(parts[1]);
      const newTitle = parts.slice(2).join(" ");

      if (!id || !newTitle)
        return { ok: false, message: "Usage: /rename <id> <new title>" };

      const task = await storage.get(id);
      if (!task) return { ok: false, message: "Task not found." };

      const old = task.title;
      task.title = newTitle;
      addHistory(
        task,
        "renamed",
        `Title changed from "${old}" to "${newTitle}"`,
        sender
      );

      await storage.update(id, task);

      return { ok: true, message: `Task #${id} renamed.` };
    }

    /* ===========================================================
       /assign ID USER
    ============================================================ */
    case "/assign": {
      const id = parseInt(parts[1]);
      const user = parts[2];

      if (!id || !user)
        return { ok: false, message: "Usage: /assign <id> <user>" };

      const task = await storage.get(id);
      if (!task) return { ok: false, message: "Task not found." };

      const old = task.assigned_to || "Unassigned";
      task.assigned_to = user;
      addHistory(
        task,
        "assigned",
        `Assigned changed from ${old} to ${user}`,
        sender
      );

      await storage.update(id, task);
      return { ok: true, message: `Task #${id} assigned to ${user}.` };
    }

    /* ===========================================================
       /due ID YYYY-MM-DD
    ============================================================ */
    case "/due": {
      const id = parseInt(parts[1]);
      const date = parts[2];

      if (!id || !date)
        return { ok: false, message: "Usage: /due <id> <date>" };

      const task = await storage.get(id);
      if (!task) return { ok: false, message: "Task not found." };

      const old = task.due || "—";
      task.due = date;
      addHistory(task, "due", `Due changed from ${old} to ${date}`, sender);

      await storage.update(id, task);
      return { ok: true, message: `Due date set for task #${id}.` };
    }

    /* ===========================================================
       /comment ID TEXT
    ============================================================ */
    case "/comment": {
      const id = parseInt(parts[1]);
      const text = parts.slice(2).join(" ");
      if (!id || !text)
        return { ok: false, message: "Usage: /comment <id> <text>" };

      const task = await storage.get(id);
      if (!task) return { ok: false, message: "Task not found." };

      task.comments.push({ user: sender, text, time: todayString() });
      addHistory(task, "comment", `Comment added: "${text}"`, sender);
      await storage.update(id, task);

      return { ok: true, message: `Comment added.` };
    }

    /* ===========================================================
       /subtask parentId TITLE
    ============================================================ */
    case "/subtask": {
      const parentId = parseInt(parts[1]);
      const title = parts.slice(2).join(" ");

      if (!parentId || !title)
        return { ok: false, message: "Usage: /subtask <parentId> <title>" };

      const parent = await storage.get(parentId);
      if (!parent) return { ok: false, message: "Parent task not found." };

      const sub = await storage.add({
        title,
        assigned_to: parent.assigned_to,
        status: "pending",
        priority: "medium",
        due: parent.due,
        comments: [],
        subtasks: [],
        parent: parentId,
        deleted: false,
        prev_status: null,
        history: [],
      });

      addHistory(
        parent,
        "subtask_created",
        `Subtask #${sub.id} created: "${title}"`,
        sender
      );

      parent.subtasks.push(sub.id);
      await storage.update(parentId, parent);

      return { ok: true, message: `Subtask #${sub.id} created.` };
    }

    /* ===========================================================
       /status ID pending|in-progress|completed
    ============================================================ */
    case "/status": {
      const id = parseInt(parts[1]);
      const status = parts[2];

      if (!id || !["pending", "in-progress", "completed"].includes(status))
        return { ok: false, message: "Usage: /status <id> <status>" };

      const task = await storage.get(id);
      if (!task) return { ok: false, message: "Task not found." };

      const old = task.status;
      task.prev_status = task.status;
      task.status = status;
      addHistory(
        task,
        "status",
        `Status changed from ${old} to ${status}`,
        sender
      );

      await storage.update(id, task);
      return { ok: true, message: `Status updated.` };
    }

    /* ===========================================================
       /priority ID low|medium|high|critical
    ============================================================ */
    case "/priority": {
      const id = parseInt(parts[1]);
      const level = parts[2];

      if (!id || !["low", "medium", "high", "critical"].includes(level))
        return { ok: false, message: "Usage: /priority <id> <level>" };

      const task = await storage.get(id);
      if (!task) return { ok: false, message: "Task not found." };

      const old = task.priority || "medium";
      task.priority = level;
      addHistory(
        task,
        "priority",
        `Priority changed from ${old} to ${level}`,
        sender
      );

      await storage.update(id, task);
      return { ok: true, message: `Priority updated.` };
    }

    /* ===========================================================
       /info ID
    ============================================================ */
    case "/info": {
      const id = parseInt(parts[1]);
      if (!id) return { ok: false, message: "Usage: /info <id>" };

      const task = await storage.get(id);
      if (!task) return { ok: false, message: "Task not found." };

      const formatted = formatTask(task);
      return { ok: true, message: formatted, task };
    }

    /* ===========================================================
       /history ID
    ============================================================ */
    case "/history": {
      const id = parseInt(parts[1]);
      if (!id) return { ok: false, message: "Usage: /history <id>" };

      const task = await storage.get(id);
      if (!task) return { ok: false, message: "Task not found." };

      const h = (task.history || []).map(
        (e, idx) =>
          `${idx + 1}. [${e.time}] ${e.actor}: ${e.action} – ${e.details}`
      );

      return {
        ok: true,
        message: h.length
          ? `📜 **History for #${id}**\n` + h.join("\n")
          : `No history recorded for task #${id}.`,
      };
    }

    /* ===========================================================
       /whoisbusy
    ============================================================ */
    case "/whoisbusy": {
      const tasks = await storage.list();
      const counts = {};

      tasks.forEach((t) => {
        if (t.deleted) return;
        const u = t.assigned_to || "Unassigned";
        counts[u] = (counts[u] || 0) + 1;
      });

      let maxUser = null,
        maxCount = 0;
      for (const u in counts) {
        if (counts[u] > maxCount) {
          maxCount = counts[u];
          maxUser = u;
        }
      }

      return { ok: true, message: `${maxUser} has ${maxCount} tasks.` };
    }

    /* ===========================================================
       /duein DAYS
    ============================================================ */
    case "/duein": {
      const days = parseInt(parts[1]);
      if (!days) return { ok: false, message: "Usage: /duein <days>" };

      const tasks = await storage.list();
      const now = new Date();
      const future = new Date();
      future.setDate(now.getDate() + days);

      const output = tasks.filter(
        (t) =>
          t.due &&
          new Date(t.due) >= now &&
          new Date(t.due) <= future &&
          !t.deleted
      );

      if (!output.length) {
        return {
          ok: true,
          message: `No tasks due in next ${days} days.`,
          tasks: [],
        };
      }

      return {
        ok: true,
        message:
          `📅 Tasks due in next ${days} days:\n` +
          output
            .map((t) => `#${t.id} - ${t.title} (due ${t.due})`)
            .join("\n"),
        tasks: output,
      };
    }

    /* ===========================================================
       Improved /overdue
    ============================================================ */
    case "/overdue": {
      const tasks = await storage.list();
      const now = new Date();

      const output = tasks.filter(
        (t) =>
          !t.deleted &&
          t.due &&
          new Date(t.due) < now &&
          t.status !== "completed"
      );

      return {
        ok: true,
        message: output.length
          ? "⏰ **Overdue Tasks:**\n" +
            output
              .map((t) => `#${t.id} - ${t.title} (due ${t.due})`)
              .join("\n")
          : "🎉 No overdue tasks!",
        tasks: output,
      };
    }

    /* ===========================================================
       /completeall → mark all non-deleted tasks completed
    ============================================================ */
    case "/completeall": {
      const tasks = await storage.list();
      for (const t of tasks) {
        if (t.deleted) continue;
        if (t.status !== "completed") {
          t.prev_status = t.status;
          t.status = "completed";
          t.completed_at = new Date().toISOString();
          addHistory(
            t,
            "completed_bulk",
            "Completed via /completeall",
            sender
          );
          await storage.update(t.id, t);
        }
      }
      return { ok: true, message: "✨ All tasks marked completed." };
    }

    /* ===========================================================
       /export → CSV of all tasks
    ============================================================ */
    case "/export": {
      const csv = await storage.exportCSV();
      return {
        ok: true,
        message: "📁 **CSV Export (copy from below):**\n```csv\n" + csv + "\n```",
      };
    }

    /* ===========================================================
       /search priority:high status:pending assigned:hema
    ============================================================ */
    case "/search": {
      const query = parts.slice(1).join(" ");
      if (!query)
        return {
          ok: false,
          message:
            "Usage: /search <filters>\nExample: /search priority:high status:pending",
        };

      const tokens = query.split(/\s+/);
      const filters = {};
      const keywords = [];

      tokens.forEach((tok) => {
        if (tok.includes(":")) {
          const [k, v] = tok.split(":", 2);
          if (k && v) filters[k.toLowerCase()] = v.toLowerCase();
        } else {
          if (tok.trim()) keywords.push(tok.toLowerCase());
        }
      });

      let tasks = await storage.list();

      if (filters.status) {
        tasks = tasks.filter(
          (t) => (t.status || "").toLowerCase() === filters.status
        );
      }
      if (filters.priority) {
        tasks = tasks.filter(
          (t) => (t.priority || "").toLowerCase() === filters.priority
        );
      }
      if (filters.assigned || filters.user) {
        const val = (filters.assigned || filters.user).toLowerCase();
        tasks = tasks.filter((t) =>
          (t.assigned_to || "").toLowerCase().includes(val)
        );
      }

      if (filters.duebefore) {
        const d = new Date(filters.duebefore);
        tasks = tasks.filter((t) => t.due && new Date(t.due) <= d);
      }
      if (filters.dueafter) {
        const d = new Date(filters.dueafter);
        tasks = tasks.filter((t) => t.due && new Date(t.due) >= d);
      }

      if (keywords.length) {
        tasks = tasks.filter((t) => {
          const title = (t.title || "").toLowerCase();
          return keywords.every((k) => title.includes(k));
        });
      }

      if (!tasks.length) {
        return { ok: true, message: "No tasks matched your filters.", tasks: [] };
      }

      const lines = tasks.map(
        (t) =>
          `#${t.id} - ${t.title} [${t.status}, ${t.priority}, ${
            t.assigned_to || "Unassigned"
          }]`
      );

      return {
        ok: true,
        message: "🔎 **Search results:**\n" + lines.join("\n"),
        tasks,
      };
    }

    /* ===========================================================
       /resetall → Dangerous: ask for confirm (admin only)
    ============================================================ */
    case "/resetall": {
      if (!ADMINS.includes(sender)) {
        return { ok: false, message: "⛔ Only admins can reset all tasks." };
      }
      return {
        ok: true,
        message:
          "⚠️ This will delete *ALL* tasks. Type /confirmreset to continue.",
      };
    }

    /* ===========================================================
       /confirmreset → Delete ALL tasks (admin only)
    ============================================================ */
    case "/confirmreset": {
      if (!ADMINS.includes(sender)) {
        return { ok: false, message: "⛔ You are not authorized." };
      }
      await storage.reset();
      return { ok: true, message: "🗑️ All tasks deleted. Storage reset." };
    }

    /* ===========================================================
       UNKNOWN COMMAND
    ============================================================ */
    default:
      return { ok: false, message: "Unknown command. Try /help" };
  }
};

module.exports = taskbot;
