const express = require("express");
const app = express();
const taskbot = require("./bot/taskbot");
const storage = require("./services/storage");

app.use(express.json());
app.use(express.static("public")); // dashboard.html inside public/

app.post("/api/command", async (req, res) => {
  const { command, sender } = req.body;
  const resp = await taskbot.dispatch(command, sender || "unknown");
  res.json(resp);
});

app.get("/api/tasks", async (req, res) => {
  const tasks = await storage.list();
  res.json({ tasks });
});

app.get("/api/stats", async (req, res) => {
  const stats = await storage.stats();
  res.json({ stats });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
