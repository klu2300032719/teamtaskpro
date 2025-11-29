// server.js
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

const taskbot = require("./bot/taskbot");
const storage = require("./services/storage");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

/* -------------------------------
   Serve static frontend
-------------------------------- */

// Serve /public if needed
app.use(express.static(path.join(__dirname, "public")));

// Serve widget folder explicitly (needed for Cliq widget UI)
app.use("/widget", express.static(path.join(__dirname, "widget")));

/* -------------------------------
   API: Stats
-------------------------------- */
app.get("/api/stats", async (req, res) => {
  try {
    const stats = await storage.stats();
    res.json({ ok: true, stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Error fetching stats" });
  }
});

/* -------------------------------
   API: Tasks
-------------------------------- */
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await storage.list();
    res.json({ ok: true, tasks: tasks.filter(t => !t.deleted) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Error fetching tasks" });
  }
});

/* -------------------------------
   API: Command (Complete/Undo etc.)
-------------------------------- */
app.post("/api/command", async (req, res) => {
  try {
    const { command, sender } = req.body || {};
    const result = await taskbot.dispatch(command, sender || "dashboard");
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Command execution failed" });
  }
});

/* -------------------------------
   Start server
-------------------------------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
