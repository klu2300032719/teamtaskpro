const express = require("express");
const app = express();
const path = require("path");
const storage = require("./services/storage");
const taskbot = require("./bot/taskbot");

app.use(express.json());
app.use(express.static("widget")); // serves dashboard.html

app.get("/api/stats", async (req, res) => {
  const stats = await storage.stats();
  res.json({ stats });
});

app.get("/api/tasks", async (req, res) => {
  const tasks = await storage.list();
  res.json({ tasks });
});

app.post("/api/command", async (req, res) => {
  const { command, sender } = req.body;
  const result = await taskbot.dispatch(command, sender || "unknown");
  res.json(result);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "widget", "dashboard.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
