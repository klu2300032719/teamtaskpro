// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bot = require("./bot/taskbot");
const storage = require("./services/storage");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve dashboard widget files
app.use("/widget", express.static(__dirname + "/widget"));

// ------------------------------------------------------------
// 1️⃣ BOT ENDPOINT FOR ZOHO CLIQ (Incoming Webhook Handler)
// ------------------------------------------------------------
app.post("/bot", async (req, res) => {
  try {
    const payload = req.body || {};
    console.log("Incoming Webhook Payload:", payload);

    const body = payload.body || {};
    const message = body.text || body.message || body.command || "";
    const sender = body.user_name || body.user || body.sender || "unknown_user";

    console.log("Parsed message:", message, "from:", sender);

    if (message && message.trim() === "/start") {
      return res.json({
        ok: true,
        message: `👋 Hi ${sender}! I'm TeamTaskPro. Use /help to see all commands.`
      });
    }

    const reply = await bot.dispatch(message, sender);
    return res.json(reply || { text: "No response from bot." });

  } catch (err) {
    console.error("BOT ERROR:", err);
    return res.json({ text: "❌ Bot error processing message." });
  }
});

// ------------------------------------------------------------
// 2️⃣ Friendly GET endpoint for direct browser access
// ------------------------------------------------------------
app.get("/", (req, res) => {
  res.send(`
    <h2>🚀 TeamTaskPro Bot Backend is Running</h2>
    <p>Use this bot inside Zoho Cliq.</p>
    <p>Open Dashboard: <a href="/dashboard">Dashboard</a></p>
    <p>Bot endpoint: <code>/bot</code></p>
  `);
});

app.get("/bot", (req, res) => {
  res.send("This endpoint handles Zoho Cliq bot POST requests only.");
});

// ------------------------------------------------------------
// 3️⃣ Dashboard Shortcut Route
// ------------------------------------------------------------
app.get("/dashboard", (req, res) => {
  res.redirect("/widget/dashboard.html");
});

// ------------------------------------------------------------
// 4️⃣ API ENDPOINTS FOR DASHBOARD
// ------------------------------------------------------------
app.get("/api/tasks", async (req, res) => {
  const tasks = await storage.list();
  res.json({ ok: true, tasks });
});

app.get("/api/stats", async (req, res) => {
  const stats = await storage.stats();
  res.json({ ok: true, stats });
});

// Local manual command testing
app.post("/api/command", async (req, res) => {
  const { command, sender } = req.body;
  const result = await bot.dispatch(command, sender || "local_user");
  res.json(result);
});

// Safe Reset endpoint
app.post("/api/reset", async (req, res) => {
  await storage.reset();
  res.json({ ok: true, message: "All tasks deleted." });
});

// ------------------------------------------------------------
// 5️⃣ Scheduler load (safe)
// ------------------------------------------------------------
try {
  require("./scheduler");
  console.log("⏰ Scheduler loaded successfully");
} catch (err) {
  console.log("⚠ Scheduler not loaded:", err.message);
}

// ------------------------------------------------------------
// 6️⃣ PORT CONFIG
// ------------------------------------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("=====================================");
  console.log(" TeamTaskPro SERVER RUNNING");
  console.log(" Port =", PORT);
  console.log("=====================================");
  console.log(`Dashboard → http://localhost:${PORT}/dashboard`);
  console.log(`Widget Raw → http://localhost:${PORT}/widget/dashboard.html`);
});

// ------------------------------------------------------------
// 7️⃣ 404 Handler
// ------------------------------------------------------------
app.use((req, res) => {
  res.status(404).send("❌ Route not found. Try /dashboard or /bot.");
});
