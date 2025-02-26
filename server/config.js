require("dotenv").config();
const path = require("path");

const config = {
  port: process.env.PORT || 5000,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  anthropicModel: process.env.ANTHROPIC_MODEL || "claude-3-7-sonnet-latest",
  backstopConfigPath: "./backstop.json",
  paths: {
    backstopData: path.join(__dirname, "backstop_data"),
    htmlReport: path.join(__dirname, "backstop_data/html_report"),
    bitmapsReference: path.join(__dirname, "backstop_data/bitmaps_reference"),
    bitmapsTest: path.join(__dirname, "backstop_data/bitmaps_test"),
  },
  viewports: {
    desktop: { width: 1280, height: 800 },
    laptop: { width: 1024, height: 768 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 },
    mobileSmall: { width: 320, height: 568 },
  }
};

// Validate required configuration
if (!config.anthropicApiKey) {
  console.error("ERROR: Missing ANTHROPIC_API_KEY environment variable");
  process.exit(1);
}

module.exports = config;
