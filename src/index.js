const express = require("express");
require("dotenv").config();

const candidatesRouter = require("./routes/candidates");
const jobsRouter = require("./routes/jobs");
const pool = require("./db/pool");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

app.get("/health/db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    return res.json({
      status: "ok",
      time: result.rows[0].now,
    });
  } catch (err) {
    return res.status(500).json({
      code: "DATABASE_HEALTH_CHECK_FAILED",
      message: "Database health check failed",
      details: [],
    });
  }
});

app.use("/candidates", candidatesRouter);
app.use("/jobs", jobsRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});