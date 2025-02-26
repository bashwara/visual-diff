const fs = require("fs");
const logger = require("../utils/logger");

/**
 * Base class for LLM services with common functionality
 */
class BaseLLMService {
  /**
   * Get image base64 encoding
   */
  getBase64Image(imagePath) {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      return imageBuffer.toString("base64");
    } catch (err) {
      logger.error("Error reading image file", err);
      throw err;
    }
  }

  /**
   * Save AI feedback to JSON file
   */
  saveFeedback(reportFolderPath, feedback) {
    try {
      fs.writeFileSync(
        `${reportFolderPath}/llm_feedback.json`,
        JSON.stringify({ feedback })
      );
      logger.info("Saved AI feedback to file");
      return true;
    } catch (err) {
      logger.error("Error saving AI feedback", err);
      throw err;
    }
  }

  /**
   * Get UI feedback prompt
   */
  getUIFeedbackPrompt() {
    return `As a UI/UX expert, analyze this interface and provide actionable feedback:

    1. VISUAL ASSESSMENT
       - Color palette: harmony, contrast ratios, brand consistency
       - Typography: readability, hierarchy, appropriate sizing
       - Layout: balance, white space, alignment, responsive concerns
       - Visual hierarchy: attention flow, emphasis of important elements

    2. USABILITY ANALYSIS
       - Intuitive navigation and information architecture
       - Clarity of interactive elements and affordances
       - Interaction patterns and expected behaviors
       - Cognitive load and complexity assessment

    3. ACCESSIBILITY EVALUATION
       - WCAG compliance concerns (AA standard minimum)
       - Color contrast issues for text and interactive elements
       - Touch target sizing and spacing
       - Keyboard navigability concerns

    4. SPECIFIC RECOMMENDATIONS
       - Prioritized list of issues by impact on user experience
       - Concrete suggestions with clear implementation guidance
       - References to relevant UI/UX patterns and best practices

    Format your response with clear markdown headings, bullet points, and where appropriate, code or design specifications.`;
  }
}

module.exports = BaseLLMService;
