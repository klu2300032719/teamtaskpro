// server.js
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

const taskbot = require("./bot/taskbot");
const storage = require("./services/storage");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Serve static frontend (dashboard)
app.use(express.static(path.join(__dirname, "public")));

/* -------------------------------
   API: Stats
-------------------------------- */
app.get("/api/stats", async (req, res) => {
  try {
    const stats = await storage.stats();
    res.json({ ok: true, stats });
  } catch (err) {
    console.error("Error in /api/stats:", err);
    res.status(500).json({ ok: false, message: "Error getting stats" });
  }
});

/* -------------------------------
   API: All Tasks (for dashboard)
-------------------------------- */
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await storage.list();
    const visible = tasks.filter((t) => !t.deleted);
    res.json({ ok: true, tasks: visible });
  } catch (err) {
    console.error("Error in /api/tasks:", err);
    res.status(500).json({ ok: false, message: "Error getting tasks" });
  }
});

/* -------------------------------
   API: Command (from dashboard)
   Body: { command: "/complete 3", sender: "dashboard" }
-------------------------------- */
app.post("/api/command", async (req, res) => {
  try {
    const { command, sender } = req.body || {};
    const result = await taskbot.dispatch(command, sender || "dashboard");
    res.json(result);
  } catch (err) {
    console.error("Error in /api/command:", err);
    res.status(500).json({ ok: false, message: "Error executing command" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ TeamTaskPro server running at http://localhost:${PORT}`);
});
