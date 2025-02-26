const backstopService = require("../services/backstopService");
const anthropicService = require("../services/anthropicService");
const reportInjector = require("../utils/reportInjector");
const logger = require("../utils/logger");
const config = require("../config");
const fs = require("fs");
const path = require("path");

/**
 * Controller handling UI comparison operations
 */
const compareController = {
  /**
   * Run visual comparison between reference and test URLs
   */
  async runComparison(req, res) {
    try {
      const { referenceUrl, testUrl, viewportType } = req.body;
      
      // Validate request inputs
      if (!referenceUrl || !testUrl) {
        logger.warn("Request missing URLs", { referenceUrl, testUrl });
        return res.status(400).json({ error: "Both URLs are required" });
      }
      
      logger.info("Starting comparison", { referenceUrl, testUrl, viewportType });
      
      // Generate backstop config
      const { config: backstopConfig, runId, datetime } = backstopService.generateConfig(
        referenceUrl, 
        testUrl, 
        viewportType
      );
      
      // Save config - pass the actual backstop config object
      backstopService.saveConfig(backstopConfig);
      
      try {
        // Run backstop reference
        await backstopService.runReference();
        logger.info("Backstop reference completed");
        
        // Run backstop test
        await backstopService.runTest();
        
        // Get reference image path
        const referencePath = backstopService.getReferenceImagePath(runId, datetime);
        const reportFolderPath = backstopService.getReportFolderPath(runId);
        
        // Check if reference image exists
        if (backstopService.referenceImageExists(referencePath)) {
          try {
            // Get AI feedback
            const claudeResponse = await anthropicService.getUIFeedback(referencePath);
            
            // Save the AI response
            anthropicService.saveFeedback(reportFolderPath, claudeResponse);
            
            // Inject custom script into report
            reportInjector.injectCustomScriptIntoReport(reportFolderPath);
            
            return res.json({
              message: "Comparison complete with LLM feedback",
              reportId: runId,
            });
          } catch (err) {
            logger.error("AI feedback generation failed", err);
            
            return res.json({
              message: "Comparison complete, but LLM feedback failed",
              reportId: runId,
              error: err.message,
            });
          }
        } else {
          logger.warn(`Reference image not found: ${referencePath}`);
          return res.json({
            message: "Comparison complete, reference image not found for LLM",
            reportId: runId,
          });
        }
      } catch (error) {
        logger.error("Comparison process failed", error);
        return res.status(500).json({
          error: "Comparison failed",
          message: error.message,
        });
      }
    } catch (err) {
      logger.error("Unexpected error in comparison controller", err);
      return res.status(500).json({
        error: "Internal server error",
        message: err.message,
      });
    }
  }
};

module.exports = compareController;
