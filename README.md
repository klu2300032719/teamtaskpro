
**TeamTaskPro – Zoho Cliq Task Bot**

TeamTaskPro is a smart task management bot for Zoho Cliq that helps teams create, assign, track, and complete tasks directly from chat. It also includes a web dashboard widget to visualize tasks and stats for your team.[1][2]
Features

1.Create tasks from any Cliq chat using simple commands.  
2.Assign tasks to teammates and update status and priority.  
3.Add comments, subtasks, and due dates to keep work organized.  
4.Smart task creation that auto-generates subtasks for a workflow.  
5.See who is busiest and list upcoming or overdue tasks.  
6.Web dashboard to view tasks and basic stats in the browser.  

**Tech Stack**

1.Node.js + Express backend
2.JSON file storage service (`services/storage.js`)  
3.Zoho Cliq bot + Deluge message handler
4.Simple HTML/JS widget for the dashboard  

**Clone and Install**

git clone https://github.com/klu2300032719/teamtaskpro.git
cd teamtaskpro
npm install

**Run Locally**

npm start
 or
node server.js

By default the server runs on http://localhost:3000.

Bot endpoint: POST /bot  
Dashboard: http://localhost:3000/dashboard  
Raw widget: http://localhost:3000/widget/dashboard.html 

**Deploying**

You can deploy this app on any Node-compatible platform (Render, Catalyst, etc.).  
Set the public base URL, for example:

https://teamtaskpro-l2op.onrender.com


**Important URLs:**

- Bot endpoint: https://teamtaskpro-l2op.onrender.com/bot  
- Dashboard: https://teamtaskpro-l2op.onrender.com/dashboard 

**Zoho Cliq Setup (Webhook)**

1. Create a bot in Zoho Cliq Developer Console.
2. Add a Message Handler and use a Deluge script that:  
   - Reads message and user.  
   - Wraps them as JSON { "body": { "text": "...", "user": "..." } }.  
   - Sends a POST request to https://teamtaskpro-l2op.onrender.com/bot with Content-Type: application/json.
3. Save the handler and start chatting with the bot in Cliq.

**Commands**

Some useful commands supported by the bot:

- /help – Show all available commands.  
- /addtask <title> – Create a new task assigned to you.  
- /smarttask <title> – Create a parent task with 4 predefined subtasks.  
- /info <id> – Show full details of a task.  
- /assign <id> <user> – Assign a task to a teammate.  
- /due <id> <YYYY-MM-DD> – Set a due date.  
- /comment <id> <text> – Add a comment.  
- /subtask <parentId> <title> – Create a subtask under a parent.  
- /status <id> <pending|in-progress|completed> – Update status.  
- /priority <id> <low|medium|high|critical> – Update priority.  
- /complete <id> and /undo <id> – Mark complete and undo.  
- /whoisbusy – See who has the most tasks.  
- /duein <days> – Tasks due in the next N days.  
- /overdue – List tasks past their due date.  

(You can update this list as your features evolve.)

**API Endpoints**

For the dashboard and integrations:
GET /api/tasks – Return all tasks as JSON.  
GET /api/stats – Basic stats summary.  
POST /api/command – Test bot commands locally with JSON body { "command": "...", "sender": "user" }.  

**Project Structure**


bot/
  taskbot.js       # Bot command dispatcher
services/
  storage.js       # Simple storage layer
widget/
  dashboard.html   # Web dashboard
server.js          # Express app entry point
manifest.json      # Cliq extension manifest

**Team**
Team Name:VKonnect  
Project:TeamTaskPro – Smart Task Management Bot for Zoho Cliq  

