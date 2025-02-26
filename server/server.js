const express = require("express");
const cors = require("cors");
const path = require("path");
const logger = require("./utils/logger");
const config = require("./config");
const errorHandler = require("./middleware/errorHandler");
const compareController = require("./controllers/compareController");
const reportsController = require("./controllers/reportsController");

// Create Express application
const app = express();

// Apply middleware
app.use(cors());
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Serve static files
app.use("/reports", express.static(config.paths.htmlReport));
app.use("/bitmaps_reference", express.static(config.paths.bitmapsReference));
app.use("/bitmaps_test", express.static(config.paths.bitmapsTest));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

// Define routes with controller methods
app.post("/compare", compareController.runComparison);
app.get("/reports/:id", reportsController.getReport);

// Error handling middleware
app.use(errorHandler);

// Start server
const port = config.port;
app.listen(port, () => {
  logger.info(`Server running on http://localhost:${port}`);
  logger.info(`Serving reports from: ${config.paths.htmlReport}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});
