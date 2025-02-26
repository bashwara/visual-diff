const fs = require("fs");
const Anthropic = require("@anthropic-ai/sdk");
const logger = require("../utils/logger");
const config = require("../config");
const BaseLLMService = require("./baseLLMService");

/**
 * Service to handle Anthropic API operations
 */
class AnthropicService extends BaseLLMService {
  constructor() {
    super();
    this.client = new Anthropic({
      apiKey: config.anthropicApiKey,
    });
    logger.info("Anthropic client initialized");
  }

  /**
   * Get AI feedback for UI image
   */
  async getUIFeedback(imagePath) {
    try {
      logger.info("Getting AI feedback for image:", imagePath);
      const base64Image = this.getBase64Image(imagePath);
      const prompt = this.getUIFeedbackPrompt();
      
      const response = await this.client.messages.create({
        model: config.anthropicModel,
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/png",
                  data: base64Image,
                },
              },
            ],
          },
        ],
      });

      logger.info("Received AI feedback response from Anthropic");
      return response.content[0].text;
    } catch (err) {
      logger.error("Error getting AI feedback from Anthropic", err);
      throw err;
    }
  }
}

module.exports = new AnthropicService();
