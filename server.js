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


// ------------------------------------------------------------
// 1️⃣  BOT ENDPOINT FOR ZOHO CLIQ (Incoming Webhook Handler)
// ------------------------------------------------------------
app.post("/bot", async (req, res) => {
  try {
    const payload = req.body || {};

    console.log("Incoming Webhook Payload:", payload);

    // Webhook handler sends:
    // { body: { text: "...", user_name: "...", ... } }
    const body = payload.body || {};

    const message =
      body.text || body.message || body.command || "";


    const sender =
      body.user_name ||
      body.user ||
      body.sender ||
      "unknown_user";

    console.log("Parsed message:", message, "from:", sender);

    const reply = await bot.dispatch(message, sender);

    return res.json(reply || { text: "No response from bot." });
  } catch (err) {
    console.error("BOT ERROR:", err);
    return res.json({ text: "Bot error processing message." });
  }
});


// ------------------------------------------------------------
// 2️⃣  OPTIONAL ENDPOINTS FOR SLASH COMMANDS (If Needed)
// ------------------------------------------------------------
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


// ------------------------------------------------------------
// 3️⃣  API ENDPOINTS FOR DASHBOARD WIDGET
// ------------------------------------------------------------
app.get("/api/tasks", async (req, res) => {
  const tasks = await storage.list();
  res.json({ ok: true, tasks });
});

app.get("/api/stats", async (req, res) => {
  const stats = await storage.stats();
  res.json({ ok: true, stats });
});


// ------------------------------------------------------------
// 4️⃣  LOCAL TEST ENDPOINT (OPTIONAL)
// ------------------------------------------------------------
app.post("/api/command", async (req, res) => {
  const { command, sender } = req.body;
  const result = await bot.dispatch(command, sender || "local_user");
  res.json(result);
});


// ------------------------------------------------------------
// 5️⃣  RESET ALL TASKS (OPTIONAL)
// ------------------------------------------------------------
app.post("/api/reset", async (req, res) => {
  await storage.reset();
  res.json({ ok: true, message: "All tasks deleted." });
});


// ------------------------------------------------------------
// 6️⃣  PORT CONFIG FOR RENDER
// ------------------------------------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("=====================================");
  console.log(" TeamTaskPro SERVER RUNNING");
  console.log(" Port =", PORT);
  console.log("=====================================");
  console.log(`Widget: http://localhost:${PORT}/widget/dashboard.html`);
});
