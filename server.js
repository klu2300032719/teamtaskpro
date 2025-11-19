// server.js — CLEAN VERSION (NO EMAIL, NO CRON)

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bot = require("./bot/taskbot");
const storage = require("./services/storage");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve widget files
app.use("/widget", express.static(__dirname + "/widget"));

// ----------------------
//   BASIC ENDPOINTS
// ----------------------

// Fetch all tasks (dashboard uses this)
app.get("/api/tasks", async (req, res) => {
  const tasks = await storage.list();
  res.json({ ok: true, tasks });
});

// Stats for dashboard (charts + cards)
app.get("/api/stats", async (req, res) => {
  const stats = await storage.stats();
  res.json({ ok: true, stats });
});

// Simulate bot commands locally
app.post("/api/command", async (req, res) => {
  const { command, sender } = req.body;

  if (!command) {
    return res.status(400).json({ ok: false, message: "command required" });
  }

  const result = await bot.dispatch(command, sender || "local_user");
  res.json(result);
});

// Hard reset (delete all tasks)
app.post("/api/reset", async (req, res) => {
  await storage.reset();
  res.json({ ok: true, message: "All tasks deleted." });
});

// ----------------------
//   START SERVER
// ----------------------
const PORT = 3000;

app.listen(PORT, () => {
  console.log("=====================================");
  console.log(" TeamTaskPro LOCAL SERVER RUNNING");
  console.log(" http://localhost:" + PORT);
  console.log("=====================================");
  console.log("Widget: http://localhost:3000/widget/dashboard.html");
});
