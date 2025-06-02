// backend/index.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");       // NEW: to call the Python embedding service
console.log("🚀 Server starting..."); 
const { Pool } = require("pg");       // NEW: Postgres client

const app = express();
const PORT = process.env.PORT || 5000;

// Add security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ─── 1) Configure Postgres Pool with proper error handling ─────────────────────────────────────────
const pool = new Pool({
  user: process.env.PGUSER || "postgres",
  host: process.env.PGHOST || "localhost",
  database: process.env.PGDATABASE || "tasksdb",
  password: process.env.PGPASSWORD || "your_password_here",
  port: parseInt(process.env.PGPORT, 10) || 5432,
});

// Test database connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Validate task status
const validStatuses = ['todo', 'in progress', 'done'];
const validateTaskStatus = (status) => validStatuses.includes(status);

app.use(cors());
app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request on ${req.url}`);
  next();
});
app.use(express.json());

// ─── 2) Helper: Call Embedding Service ────────────────────────────────────
async function getEmbedding(text) {
  const embedUrl = process.env.EMBEDDING_SERVICE_URL || "http://embedding-service:6000/embed";

  try {
    const res = await axios.post(embedUrl, { text });
    return res.data.embedding; // an array of 384 floats
  } catch (err) {
    console.error("Embedding service error:", err.message);
    throw new Error("Failed to get embedding");
  }
}

// ─── 3) GET /tasks → Return all tasks (without embeddings) ────────────────
app.get("/tasks", async (req, res) => {
  try {
    const result = await pool.query('SELECT id, title, description, status FROM tasks ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// ─── 4) POST /tasks → Create a new task, generate embedding, store in PG ──
app.post("/tasks", async (req, res) => {
  const { title, description, status } = req.body;
  
  // Input validation
  if (!title || !description || !status) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  
  if (!validateTaskStatus(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  if (title.length > 100) {
    return res.status(400).json({ error: "Title too long" });
  }

  if (description.length > 1000) {
    return res.status(400).json({ error: "Description too long" });
  }

  try {
    // 4.1) Generate embedding for the description
    const embedding = await getEmbedding(description);

    // 4.2) Format the embedding as a PostgreSQL vector string
    const vectorStr = '[' + embedding.join(',') + ']';

    // 4.3) Insert into Postgres, including vector column with explicit cast
    const insertQuery = `
      INSERT INTO tasks (title, description, status, embedding)
      VALUES ($1, $2, $3, $4::vector)
      RETURNING id, title, description, status;
    `;
    const values = [title, description, status, vectorStr];
    const result = await pool.query(insertQuery, values);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding task:", err.stack || err.message || err);
    if (err.message.includes("embedding")) {
      res.status(503).json({ error: "Embedding service unavailable" });
    } else {
      res.status(500).json({ error: "Failed to add task" });
    }
  }
});

// ─── 5) DELETE /tasks/:id → Delete a task (by ID) ─────────────────────────
app.delete("/tasks/:id", async (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  if (isNaN(taskId)) {
    return res.status(400).json({ error: "Invalid task ID" });
  }

  try {
    await pool.query("DELETE FROM tasks WHERE id = $1", [taskId]);
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting task:", err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// ─── 6) GET /tasks/search?q=… → Vector similarity search top 3 ───────────
app.get("/tasks/search", async (req, res) => {
  console.log("🔍 SEARCH ENDPOINT HIT:", req.query.q);

  const queryText = req.query.q;
  if (!queryText) {
    console.log("❌ Missing query parameter");
    return res.status(400).json({ error: 'Missing query parameter "q"' });
  }

  try {
    console.log("✅ Search query received:", queryText);

    const queryEmbedding = await getEmbedding(queryText);
    console.log("✅ Embedding generated, first 5 values:", queryEmbedding.slice(0, 5));

    // Format the embedding as a PostgreSQL vector string
    const vectorStr = '[' + queryEmbedding.join(',') + ']';

    const searchSql = `
      SELECT id, title, description, status
      FROM tasks
      ORDER BY embedding <-> $1::vector
      LIMIT 3;
    `;
    
    const result = await pool.query(searchSql, [vectorStr]);
    console.log("✅ Query result rows:", result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Search error in backend:", err.stack || err.message || err);
    res.status(500).json({ error: "Search failed" });
  }
});

// Add health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.get("/", (req, res) => {
  res.send("Task manager backend is running!");
});

// ─── 7) Start server ───────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on port ${process.env.PORT || 5000}`);
});
