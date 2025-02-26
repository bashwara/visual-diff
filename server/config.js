require("dotenv").config();
const path = require("path");

const config = {
  port: process.env.PORT || 5000,
  
  // LLM Provider Configuration
  llmProvider: process.env.LLM_PROVIDER || "anthropic", // "anthropic" or "openai"
  
  // Anthropic Configuration
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  anthropicModel: process.env.ANTHROPIC_MODEL || "claude-3-7-sonnet-latest",
  
  // OpenAI Configuration
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL || "gpt-4o",
  
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

// Validate required configuration based on provider
if (config.llmProvider === "anthropic" && !config.anthropicApiKey) {
  console.error("ERROR: Missing ANTHROPIC_API_KEY environment variable");
  process.exit(1);
} else if (config.llmProvider === "openai" && !config.openaiApiKey) {
  console.error("ERROR: Missing OPENAI_API_KEY environment variable");
  process.exit(1);
}

module.exports = config;
