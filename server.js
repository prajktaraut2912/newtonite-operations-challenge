
const express = require("express");
const helmet = require("helmet");
const crypto = require("crypto");

const app = express();
app.use(helmet());
app.use(express.json());
app.use(express.static("public"));
const PORT = process.env.PORT || 3000;

// Development-only data.
// Replace with PostgreSQL before production.
const users = [
  { id: "u1", name: "Admin User", role: "admin", team: "operations" },
  { id: "u2", name: "Team Member", role: "member", team: "operations" }
];

const tasks = [];
const activities = [];
const idempotencyKeys = new Set();

const allowedStatuses = {
  Open: ["In Progress", "Cancelled"],
  "In Progress": ["Open", "Blocked", "Completed", "Cancelled"],
  Blocked: ["In Progress", "Cancelled"],
  Completed: [],
  Cancelled: []
};

function currentUser(req, res, next) {
  // Temporary demo identity. Never trust a client-supplied
  // user ID or use this mechanism in production.
  const userId = req.header("x-demo-user");
  const user = users.find(item => item.id === userId);

  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  req.user = user;
  next();
}

function canView(user, task) {
  return user.role === "admin" || user.team === task.team;
}

function canEdit(user, task) {
  return user.role === "admin" ||
    (user.team === task.team && task.ownerId === user.id);
}

function recordActivity(taskId, actorId, action, details) {
  activities.push({
    id: crypto.randomUUID(),
    taskId,
    actorId,
    action,
    details,
    createdAt: new Date().toISOString()
  });
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "newtonite-operations" });
});

app.get("/api/tasks", currentUser, (req, res) => {
  const { status, priority, search } = req.query;

  let result = tasks.filter(task => canView(req.user, task));

  if (status) {
    result = result.filter(task => task.status === status);
  }

  if (priority) {
    result = result.filter(task => task.priority === priority);
  }

  if (search) {
    const query = String(search).toLowerCase();
    result = result.filter(task =>
      task.title.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query)
    );
  }

  result.sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  res.json({ items: result, total: result.length });
});

app.post("/api/tasks", currentUser, (req, res) => {
  const key = req.header("Idempotency-Key");

  if (!key) {
    return res.status(400).json({
      error: "Idempotency-Key header is required"
    });
  }

  const { title, description = "", priority = "Medium" } = req.body;

  if (idempotencyKeys.has(key)) {
    return res.status(409).json({
      error: "This request has already been processed"
    });
  }

  if (typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }

  if (title.length > 200 || typeof description !== "string" ||
      description.length > 5000) {
    return res.status(400).json({ error: "Invalid field length" });
  }

  if (!["Low", "Medium", "High", "Critical"].includes(priority)) {
    return res.status(400).json({ error: "Invalid priority" });
  }

  const task = {
    id: crypto.randomUUID(),
    title: title.trim(),
    description,
    priority,
    status: "Open",
    ownerId: req.user.id,
    team: req.user.team,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  idempotencyKeys.add(key);
  tasks.push(task);
  recordActivity(task.id, req.user.id, "created", {
    title: task.title
  });

  res.status(201).json({ item: task });
});

app.patch("/api/tasks/:id", currentUser, (req, res) => {
  const task = tasks.find(item => item.id === req.params.id);

  if (!task || !canView(req.user, task)) {
    return res.status(404).json({ error: "Task not found" });
  }

  if (!canEdit(req.user, task)) {
    return res.status(403).json({ error: "Permission denied" });
  }

  const expectedVersion = Number(req.header("If-Match"));

  if (!Number.isInteger(expectedVersion)) {
    return res.status(428).json({
      error: "If-Match header with the current version is required"
    });
  }

  if (expectedVersion !== task.version) {
    return res.status(412).json({
      error: "Task changed. Refresh and try again.",
      currentVersion: task.version
    });
  }

  const { title, description, priority, status } = req.body;

  if (title !== undefined &&
      (typeof title !== "string" || !title.trim() || title.length > 200)) {
    return res.status(400).json({ error: "Invalid title" });
  }

  if (description !== undefined &&
      (typeof description !== "string" || description.length > 5000)) {
    return res.status(400).json({ error: "Invalid description" });
  }

  if (priority !== undefined &&
      !["Low", "Medium", "High", "Critical"].includes(priority)) {
    return res.status(400).json({ error: "Invalid priority" });
  }

  if (status !== undefined &&
      (!allowedStatuses[task.status] ||
       !allowedStatuses[task.status].includes(status))) {
    return res.status(400).json({
      error: "Invalid workflow transition"
    });
  }

  const changes = {};

  for (const field of ["title", "description", "priority", "status"]) {
    if (req.body[field] !== undefined &&
        req.body[field] !== task[field]) {
      changes[field] = {
        from: task[field],
        to: req.body[field]
      };
      task[field] = req.body[field];
    }
  }

  if (Object.keys(changes).length === 0) {
    return res.json({ item: task, unchanged: true });
  }

  task.version += 1;
  task.updatedAt = new Date().toISOString();

  recordActivity(task.id, req.user.id, "updated", changes);

  res.json({ item: task });
});

app.get("/api/tasks/:id/activity", currentUser, (req, res) => {
  const task = tasks.find(item => item.id === req.params.id);

  if (!task || !canView(req.user, task)) {
    return res.status(404).json({ error: "Task not found" });
  }

  res.json({
    items: activities.filter(item => item.taskId === task.id)
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Newtonite Operations API listening on port ${PORT}`);
  });
}

module.exports = { app, tasks, activities, users };
