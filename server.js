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

// ------------------------------------------------
// 1️⃣  BOT MAIN ENDPOINT for ZOHO CLIQ
// ------------------------------------------------
app.post("/bot", async (req, res) => {
  try {
    const data = req.body;

    const command = data?.text || "";      // message text
    const sender = data?.user?.name || ""; // cliq username

    const reply = await bot.dispatch(command, sender);

    res.json(reply);
  } catch (err) {
    console.error("Bot error:", err);
    res.json({
      text: "Something went wrong in the bot handler.",
    });
  }
});

// ------------------------------------------------
// 2️⃣  INDIVIDUAL COMMAND ENDPOINTS (optional)
//     If you plan to use Slash Commands
// ------------------------------------------------
app.post("/addtask", async (req, res) => {
  const { text, user } = req.body;
  const reply = await bot.dispatch("addtask " + text, user);
  res.json(reply);
});

app.post("/mytasks", async (req, res) => {
  const { user } = req.body;
  const reply = await bot.dispatch("mytasks", user);
  res.json(reply);
});

// ------------------------------------------------
// 3️⃣  API ENDPOINTS for dashboard
// ------------------------------------------------
app.get("/api/tasks", async (req, res) => {
  const tasks = await storage.list();
  res.json({ ok: true, tasks });
});

app.get("/api/stats", async (req, res) => {
  const stats = await storage.stats();
  res.json({ ok: true, stats });
});

// Testing bot locally
app.post("/api/command", async (req, res) => {
  const { command, sender } = req.body;
  const result = await bot.dispatch(command, sender || "local_user");
  res.json(result);
});

// Reset tasks
app.post("/api/reset", async (req, res) => {
  await storage.reset();
  res.json({ ok: true, message: "All tasks deleted." });
});

// ------------------------------------------------
// 4️⃣  PORT CONFIG → Works in Render
// ------------------------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("=====================================");
  console.log(" TeamTaskPro SERVER RUNNING");
  console.log(" Port =", PORT);
  console.log("=====================================");
  console.log(`Widget: http://localhost:${PORT}/widget/dashboard.html`);
});
