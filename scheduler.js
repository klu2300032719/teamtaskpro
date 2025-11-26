// scheduler.js
const cron = require("node-cron");
const storage = require("./services/storage");

// Placeholder: here you can call Zoho Cliq API to DM users.
function sendNotification(user, text) {
  console.log(`🔔 [NOTIFY] -> ${user}: ${text}`);
}

// Run every minute
cron.schedule("*/1 * * * *", async () => {
  try {
    const tasks = await storage.list();
    const now = new Date();

    const overdue = tasks.filter(
      t => t.due && new Date(t.due) < now && t.status !== "completed"
    );

    overdue.forEach(t => {
      if (t.assigned_to) {
        sendNotification(
          t.assigned_to,
          `⏰ Overdue task: "${t.title}" (due ${t.due})`
        );
      }
    });

    if (overdue.length) {
      console.log(`⏰ Reminder tick: ${overdue.length} overdue tasks.`);
    }
  } catch (e) {
    console.error("Scheduler error:", e);
  }
});
