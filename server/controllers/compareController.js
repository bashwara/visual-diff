const backstopService = require("../services/backstopService");
const llmFactory = require("../services/llmFactory");
const reportInjector = require("../utils/reportInjector");
const logger = require("../utils/logger");
const config = require("../config");

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
      const { config: backstopConfig, runId, datetime, viewportLabel } = backstopService.generateConfig(
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
        
        // Get test image path
        const testImagePath = backstopService.getTestImagePath(runId, viewportLabel);
        const reportFolderPath = backstopService.getReportFolderPath(runId);
        
        // Check if test image exists
        if (backstopService.testImageExists(testImagePath)) {
          try {
            // Get LLM service based on configuration
            const llmService = llmFactory.getService();
            
            // Get AI feedback using the selected service
            const aiResponse = await llmService.getUIFeedback(testImagePath);
            
            // Save the AI response
            llmService.saveFeedback(reportFolderPath, aiResponse);
            
            // Inject custom script into report
            reportInjector.injectCustomScriptIntoReport(reportFolderPath);
            
            return res.json({
              message: "Comparison complete with LLM feedback",
              reportId: runId,
              llmProvider: config.llmProvider
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
          logger.warn(`Test image not found: ${testImagePath}`);
          return res.json({
            message: "Comparison complete, test image not found for LLM",
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
