const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");
const config = require("../config");

/**
 * Controller handling report viewing operations
 */
const reportsController = {
  /**
   * Get a report by ID
   */
  getReport(req, res) {
    try {
      const reportId = req.params.id;
      const reportPath = path.join(config.paths.htmlReport, reportId);
      
      logger.info(`Accessing report: ${reportId}`);
      
      if (!fs.existsSync(reportPath)) {
        logger.warn(`Report not found: ${reportId}`);
        return res.status(404).json({ error: "Report not found" });
      }
      
      res.sendFile(path.join(reportPath, "index.html"));
    } catch (err) {
      logger.error("Error accessing report", err);
      res.status(500).json({ error: "Failed to retrieve report" });
    }
  }
};

module.exports = reportsController;
