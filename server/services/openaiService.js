const OpenAI = require("openai");
const logger = require("../utils/logger");
const config = require("../config");
const BaseLLMService = require("./baseLLMService");

/**
 * Service to handle OpenAI API operations
 */
class OpenAIService extends BaseLLMService {
  constructor() {
    super();
    this.client = new OpenAI({
      apiKey: config.openaiApiKey,
    });
    logger.info("OpenAI client initialized");
  }

  /**
   * Get AI feedback for UI image
   */
  async getUIFeedback(imagePath) {
    try {
      logger.info("Getting AI feedback for image:", imagePath);
      
      // Read the image as a buffer for OpenAI's API
      const imageBuffer = Buffer.from(this.getBase64Image(imagePath), 'base64');
      const prompt = this.getUIFeedbackPrompt();
      
      const response = await this.client.chat.completions.create({
        model: config.openaiModel,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${imageBuffer.toString("base64")}`,
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
      });

      logger.info("Received AI feedback response from OpenAI");
      return response.choices[0].message.content;
    } catch (err) {
      logger.error("Error getting AI feedback from OpenAI", err);
      throw err;
    }
  }
}

module.exports = new OpenAIService();
