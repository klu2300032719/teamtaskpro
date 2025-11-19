// bot/taskbot.js
const storage = require("../services/storage");

const taskbot = {};

function todayString() {
  return new Date().toLocaleString();
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
       /addtask TITLE
    ============================================================ */
    case "/addtask": {
      const title = parts.slice(1).join(" ");
      if (!title) return { ok:false, message:"Usage: /addtask <title>" };

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
        prev_status: null
      });

      return { ok:true, message:`Task added (#${task.id}): ${title}`, task };
    }

    /* ===========================================================
       /smarttask TITLE
       Auto-create 4 subtasks (Research → Plan → Draft → Finalize)
    ============================================================ */
    case "/smarttask": {
      const title = parts.slice(1).join(" ");
      if (!title) return { ok:false, message:"Usage: /smarttask <title>" };

      const now = new Date();
      const due = new Date();
      due.setDate(now.getDate() + 7);

      const parent = await storage.add({
        title,
        assigned_to: sender,
        status: "pending",
        priority: "High",
        due: due.toISOString(),
        comments: [],
        subtasks: [],
        parent: null,
        deleted: false,
        prev_status: null
      });

      const steps = [
        { label:"Research", assignee:"partner" },
        { label:"Plan", assignee:"varshini" },
        { label:"Draft", assignee:"rahul" },
        { label:"Finalize", assignee: sender }
      ];

      const subtasks = [];

      for (const s of steps) {
        const sub = await storage.add({
          title: `${s.label}: ${title}`,
          assigned_to: s.assignee,
          status: "pending",
          priority: "Medium",
          due: due.toISOString(),
          comments: [],
          subtasks: [],
          parent: parent.id,
          deleted:false,
          prev_status:null
        });
        parent.subtasks.push(sub.id);
        subtasks.push(sub);
      }

      await storage.update(parent.id, parent);

      return {
        ok: true,
        message: `Smart task created: ${title} with 4 subtasks`,
        parent,
        subtasks
      };
    }

    /* ===========================================================
       /complete ID
    ============================================================ */
    case "/complete": {
      const id = parseInt(parts[1]);
      if (!id) return { ok:false, message:"Usage: /complete <id>" };

      const task = await storage.get(id);
      if (!task || task.deleted) return { ok:false, message:"Task not found." };

      task.prev_status = task.status;
      task.status = "completed";
      task.completed_at = new Date().toISOString();

      await storage.update(id, task);
      return { ok:true, message:`Task #${id} marked complete.` };
    }

    /* ===========================================================
       /undo ID → Completed → previous status
    ============================================================ */
    case "/undo": {
      const id = parseInt(parts[1]);
      if (!id) return { ok:false, message:"Usage: /undo <id>" };

      const task = await storage.get(id);
      if (!task) return { ok:false, message:"Task not found." };

      if (task.status !== "completed")
        return { ok:false, message:"This task is not completed." };

      task.status = task.prev_status || "pending";
      task.prev_status = null;
      task.completed_at = null;

      await storage.update(id, task);
      return { ok:true, message:`Task #${id} restored.` };
    }

    /* ===========================================================
       /start ID
    ============================================================ */
    case "/start": {
      const id = parseInt(parts[1]);
      if (!id) return { ok:false, message:"Usage: /start <id>" };

      const task = await storage.get(id);
      if (!task) return { ok:false, message:"Task not found." };

      task.prev_status = task.status;
      task.status = "in-progress";

      await storage.update(id, task);
      return { ok:true, message:`Task #${id} started.` };
    }

    /* ===========================================================
       /delete ID  (soft delete)
    ============================================================ */
    case "/delete": {
      const id = parseInt(parts[1]);
      if (!id) return { ok:false, message:"Usage: /delete <id>" };

      const task = await storage.get(id);
      if (!task) return { ok:false, message:"Task not found." };

      task.deleted = true;
      await storage.update(id, task);

      return { ok:true, message:`Task #${id} deleted.` };
    }

    /* ===========================================================
       /rename ID NEW TITLE
    ============================================================ */
    case "/rename": {
      const id = parseInt(parts[1]);
      const newTitle = parts.slice(2).join(" ");

      if (!id || !newTitle)
        return { ok:false, message:"Usage: /rename <id> <new title>" };

      const task = await storage.get(id);
      if (!task) return { ok:false, message:"Task not found." };

      task.title = newTitle;
      await storage.update(id, task);

      return { ok:true, message:`Task #${id} renamed.` };
    }

    /* ===========================================================
       /assign ID USER
    ============================================================ */
    case "/assign": {
      const id = parseInt(parts[1]);
      const user = parts[2];

      if (!id || !user)
        return { ok:false, message:"Usage: /assign <id> <user>" };

      const task = await storage.get(id);
      if (!task) return { ok:false, message:"Task not found." };

      task.assigned_to = user;

      await storage.update(id, task);
      return { ok:true, message:`Task #${id} assigned to ${user}.` };
    }

    /* ===========================================================
       /due ID YYYY-MM-DD
    ============================================================ */
    case "/due": {
      const id = parseInt(parts[1]);
      const date = parts[2];

      if (!id || !date)
        return { ok:false, message:"Usage: /due <id> <date>" };

      const task = await storage.get(id);
      if (!task) return { ok:false, message:"Task not found." };

      task.due = date;

      await storage.update(id, task);
      return { ok:true, message:`Due date set for task #${id}.` };
    }

    /* ===========================================================
       /comment ID TEXT
    ============================================================ */
    case "/comment": {
      const id = parseInt(parts[1]);
      const text = parts.slice(2).join(" ");
      if (!id || !text) return { ok:false, message:"Usage: /comment <id> <text>" };

      const task = await storage.get(id);
      if (!task) return { ok:false, message:"Task not found." };

      task.comments.push({ user: sender, text, time: todayString() });
      await storage.update(id, task);

      return { ok:true, message:`Comment added.` };
    }

    /* ===========================================================
       /subtask parentId TITLE
    ============================================================ */
    case "/subtask": {
      const parentId = parseInt(parts[1]);
      const title = parts.slice(2).join(" ");

      if (!parentId || !title)
        return { ok:false, message:"Usage: /subtask <parentId> <title>" };

      const parent = await storage.get(parentId);
      if (!parent) return { ok:false, message:"Parent task not found." };

      const sub = await storage.add({
        title,
        assigned_to: parent.assigned_to,
        status: "pending",
        priority: "medium",
        due: parent.due,
        comments: [],
        subtasks: [],
        parent: parentId,
        deleted:false
      });

      parent.subtasks.push(sub.id);
      await storage.update(parentId, parent);

      return { ok:true, message:`Subtask #${sub.id} created.` };
    }

    /* ===========================================================
       /status ID pending|in-progress|completed
    ============================================================ */
    case "/status": {
      const id = parseInt(parts[1]);
      const status = parts[2];

      if (!id || !["pending","in-progress","completed"].includes(status))
        return { ok:false, message:"Usage: /status <id> <status>" };

      const task = await storage.get(id);
      if (!task) return { ok:false, message:"Task not found." };

      task.prev_status = task.status;
      task.status = status;

      await storage.update(id, task);
      return { ok:true, message:`Status updated.` };
    }

    /* ===========================================================
       /priority ID low|medium|high|critical
    ============================================================ */
    case "/priority": {
      const id = parseInt(parts[1]);
      const level = parts[2];

      if (!id || !["low","medium","high","critical"].includes(level))
        return { ok:false, message:"Usage: /priority <id> <level>" };

      const task = await storage.get(id);
      if (!task) return { ok:false, message:"Task not found." };

      task.priority = level;

      await storage.update(id, task);
      return { ok:true, message:`Priority updated.` };
    }

    /* ===========================================================
       /info ID
    ============================================================ */
    case "/info": {
      const id = parseInt(parts[1]);
      if (!id) return { ok:false, message:"Usage: /info <id>" };

      const task = await storage.get(id);
      if (!task) return { ok:false, message:"Task not found." };

      return { ok:true, task };
    }

    /* ===========================================================
       /whoisbusy
    ============================================================ */
    case "/whoisbusy": {
      const tasks = await storage.list();
      const counts = {};

      tasks.forEach(t => {
        if (t.deleted) return;
        const u = t.assigned_to || "Unassigned";
        counts[u] = (counts[u] || 0) + 1;
      });

      let maxUser = null, maxCount = 0;
      for (const u in counts) {
        if (counts[u] > maxCount) {
          maxCount = counts[u];
          maxUser = u;
        }
      }

      return { ok:true, message:`${maxUser} has ${maxCount} tasks.` };
    }

    /* ===========================================================
       /duein DAYS
    ============================================================ */
    case "/duein": {
      const days = parseInt(parts[1]);
      if (!days) return { ok:false, message:"Usage: /duein <days>" };

      const tasks = await storage.list();
      const now = new Date();
      const future = new Date();
      future.setDate(now.getDate() + days);

      const output = tasks.filter(t =>
        t.due && new Date(t.due) >= now && new Date(t.due) <= future
      );

      return { ok:true, tasks: output };
    }

    /* ===========================================================
       /overdue
    ============================================================ */
    case "/overdue": {
      const tasks = await storage.list();
      const now = new Date();

      const output = tasks.filter(t => t.due && new Date(t.due) < now);

      return { ok:true, tasks: output };
    }

    /* ===========================================================
       /resetall → Delete ALL tasks
    ============================================================ */
    case "/resetall": {
      await storage.reset();
      return { ok:true, message:"All tasks deleted. Storage reset." };
    }

    /* ===========================================================
       UNKNOWN COMMAND
    ============================================================ */
    default:
      return { ok:false, message:"Unknown command. Try /help" };
  }
};

module.exports = taskbot;
