const anthropicService = require("./anthropicService");
const openaiService = require("./openaiService");
const config = require("../config");
const logger = require("../utils/logger");

/**
 * Factory to provide the appropriate LLM service based on configuration
 */
class LLMServiceFactory {
  /**
   * Get the configured LLM service
   * @returns {Object} The appropriate LLM service
   */
  getService() {
    const provider = config.llmProvider.toLowerCase();
    
    logger.info(`Using LLM provider: ${provider}`);
    
    switch (provider) {
      case "openai":
        return openaiService;
      case "anthropic":
        return anthropicService;
      default:
        logger.warn(`Unknown LLM provider: ${provider}, falling back to Anthropic`);
        return anthropicService;
    }
  }
}

module.exports = new LLMServiceFactory();
