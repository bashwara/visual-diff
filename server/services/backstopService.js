const fs = require("fs");
const path = require("path");
const backstop = require("backstopjs");
const ULID = require("ulid");
const config = require("../config");
const logger = require("../utils/logger");

/**
 * Service to handle BackstopJS operations
 */
class BackstopService {
  /**
   * Generate a backstop configuration for comparison
   */
  generateConfig(referenceUrl, testUrl, viewportType) {
    const runId = ULID.ulid();
    const datetime = this.generateDatetimeString();

    const viewportLabel = config.viewports.hasOwnProperty(viewportType) ? viewportType : 'desktop';
    const viewport = config.viewports[viewportLabel];

    logger.info(`Creating backstop config with runId: ${runId}`);

    const backstopConfig = {
      id: "ui_comparison",
      viewports: [{ label: viewportLabel, ...viewport }],
      onBeforeScript: "puppet/onBefore.js",
      onReadyScript: "puppet/onReady.js",
      scenarios: [
        {
          label: "UI Comparison",
          cookiePath: "backstop_data/engine_scripts/cookies.json",
          url: testUrl,
          referenceUrl: referenceUrl,
          readyEvent: "",
          readySelector: "",
          delay: 5000,
          hideSelectors: [],
          removeSelectors: [],
          hoverSelector: "",
          clickSelector: "",
          postInteractionWait: 0,
          selectors: [],
          selectorExpansion: true,
          expect: 0,
          misMatchThreshold: 0.1,
          requireSameDimensions: true,
        },
      ],
      paths: {
        bitmaps_reference: `backstop_data/bitmaps_reference/${runId}/${datetime}`,
        bitmaps_test: `backstop_data/bitmaps_test/${runId}`,
        engine_scripts: "backstop_data/engine_scripts",
        html_report: `backstop_data/html_report/${runId}`,
        ci_report: `backstop_data/ci_report/${runId}`,
      },
      report: [],
      engine: "puppeteer",
      engineOptions: {
        args: ["--no-sandbox"],
      },
      asyncCaptureLimit: 5,
      asyncCompareLimit: 50,
      debug: true,
      debugWindow: true,
    };

    return { config: backstopConfig, runId, datetime, viewportLabel };
  }

  /**
   * Save backstop config to file
   */
  saveConfig(backstopConfig) {
    try {
      // Use the config path from our config module
      const configPath = config.backstopConfigPath;
      
      if (!configPath) {
        throw new Error("backstopConfigPath is not defined in config");
      }
      
      logger.info(`Saving backstop configuration to ${configPath}`);
      fs.writeFileSync(configPath, JSON.stringify(backstopConfig, null, 2));
      logger.info("Saved backstop configuration successfully");
    } catch (err) {
      logger.error("Failed to save backstop configuration", err);
      throw err;
    }
  }

  /**
   * Run backstop reference
   */
  async runReference() {
    try {
      logger.info("Starting backstop reference");
      return await backstop("reference");
    } catch (err) {
      logger.error("Error running backstop reference", err);
      throw err;
    }
  }

  /**
   * Run backstop test
   */
  async runTest() {
    try {
      logger.info("Starting backstop test");
      return await backstop("test");
    } catch (err) {
      // We don't throw here because a "mismatch errors found" is expected behavior
      logger.warn("Backstop test completed with issues", err.message);
      return { error: err.message };
    }
  }

  /**
   * Get test image path
   */
  getTestImagePath(runId, viewport) {
    const testBaseDir = path.join(config.paths.backstopData, `bitmaps_test/${runId}`);
    console.log("viewport", viewport);
    
    try {
      // Read the directory to find the test folder (assuming only one exists)
      const folders = fs.readdirSync(testBaseDir);
      
      if (folders.length === 0) {
        logger.error(`No test folders found in ${testBaseDir}`);
        throw new Error(`No test folder found in ${testBaseDir}`);
      }
      
      const testFolder = folders[0]; // Take the first (and presumably only) folder
      logger.info(`Found test folder: ${testFolder}`);
      
      return path.join(
        config.paths.backstopData,
        `bitmaps_test/${runId}/${testFolder}/ui_comparison_UI_Comparison_0_document_0_${viewport}.png`
      );
    } catch (err) {
      logger.error(`Error getting test image path for runId ${runId}:`, err);
      throw err;
    }
  }

  /**
   * Get report folder path
   */
  getReportFolderPath(runId) {
    return path.join(config.paths.htmlReport, runId);
  }

  /**
   * Check if test image exists
   */
  testImageExists(imagePath) {
    return fs.existsSync(imagePath);
  }

  /**
   * Generate datetime string for folders
   */
  generateDatetimeString() {
    const now = new Date();
    return (
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, "0") +
      now.getDate().toString().padStart(2, "0") +
      "-" +
      now.getHours().toString().padStart(2, "0") +
      now.getMinutes().toString().padStart(2, "0") +
      now.getSeconds().toString().padStart(2, "0")
    );
  }
}

module.exports = new BackstopService();
