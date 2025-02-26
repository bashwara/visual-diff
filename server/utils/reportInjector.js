const fs = require("fs");
const path = require("path");
const logger = require("./logger");

/**
 * Utility to inject custom scripts into backstop reports
 */
const reportInjector = {
  /**
   * Inject custom scripts and styles into the BackstopJS report
   */
  injectCustomScriptIntoReport(reportFolderPath) {
    try {
      logger.info(`Injecting custom script into report: ${reportFolderPath}`);
      
      // Create custom JS file to inject into report
      const customJs = this.getLLMFeedbackScript();
      
      // Create markdown-it script to handle markdown rendering
      const markdownItScript = `
        <script src="https://cdn.jsdelivr.net/npm/markdown-it@12.0.6/dist/markdown-it.min.js"></script>
      `;
      
      // Save custom JS file
      fs.writeFileSync(path.join(reportFolderPath, "llm_feedback.js"), customJs);
      logger.debug("Created llm_feedback.js file");
      
      // Inject into index.html
      const indexPath = path.join(reportFolderPath, "index.html");
      if (!fs.existsSync(indexPath)) {
        logger.error(`Report index.html not found at: ${indexPath}`);
        return false;
      }
      
      let indexContent = fs.readFileSync(indexPath, "utf8");
      
      // Add markdown-it before closing head tag
      indexContent = indexContent.replace("</head>", `${markdownItScript}</head>`);
      
      // Add custom script before closing body tag
      indexContent = indexContent.replace(
        "</body>",
        `<script src="llm_feedback.js"></script></body>`
      );
      
      // Write modified HTML back
      fs.writeFileSync(indexPath, indexContent);
      logger.info("Successfully injected custom scripts into report");
      
      return true;
    } catch (err) {
      logger.error("Failed to inject custom script into report", err);
      return false;
    }
  },
  
  /**
   * Get the LLM feedback script content
   */
  getLLMFeedbackScript() {
    return `
    // LLM Feedback integration
    (function() {
      // Debug mode
      const DEBUG = true;
      
      function debugLog(...args) {
        if (DEBUG) console.log('[AI-Feedback]', ...args);
      }
      
      debugLog('Script loaded');

      // Add CSS to the document
      const style = document.createElement('style');
      style.textContent = \`
        #ai-feedback-button {
          position: fixed;
          bottom: 20px;
          right: 110px;
          z-index: 10000;
          background: #4a90e2;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 10px 15px;
          cursor: pointer;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        
        #ai-feedback-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 9998;
          display: none;
        }
        
        #ai-feedback-panel {
          position: fixed;
          bottom: 80px;
          right: 20px;  /* Sticking to the right edge of the screen */
          width: 450px;  /* Larger width */
          max-height: 70vh;
          background: white;
          border-radius: 8px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
          padding: 20px;
          overflow-y: auto;
          z-index: 9999;
          display: none;
          word-wrap: break-word;
          overflow-x: hidden;
        }
        
        #ai-feedback-panel h1 {
          margin-top: 0;
          font-size: 18px;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        
        #ai-feedback-close {
          position: absolute;
          top: 10px;
          right: 10px;
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #666;
        }
        
        /* Ensure code blocks don't overflow */
        #ai-feedback-content pre,
        #ai-feedback-content code {
          max-width: 100%;
          white-space: pre-wrap;
          word-break: break-all;
        }
        
        /* Ensure images don't overflow */
        #ai-feedback-content img {
          max-width: 100%;
          height: auto;
        }
      \`;
      document.head.appendChild(style);
      
      // The rest of the function remains the same
      function createFeedbackUI() {
        debugLog('Creating UI elements');
        
        // Create button
        const button = document.createElement('button');
        button.id = 'ai-feedback-button';
        button.textContent = 'AI Analysis';
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'ai-feedback-overlay';
        
        // Create panel
        const panel = document.createElement('div');
        panel.id = 'ai-feedback-panel';
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.id = 'ai-feedback-close';
        closeButton.innerHTML = '&times;';
        
        // Create header
        const header = document.createElement('h1');
        header.textContent = 'AI UI/UX Analysis';
        
        // Create content container
        const content = document.createElement('div');
        content.id = 'ai-feedback-content';
        
        // Assemble panel
        panel.appendChild(closeButton);
        panel.appendChild(header);
        panel.appendChild(content);
        
        // Add to document
        document.body.appendChild(button);
        document.body.appendChild(overlay);
        document.body.appendChild(panel);
        
        // Add event listeners
        button.addEventListener('click', () => {
          debugLog('Button clicked');
          panel.style.display = 'block';
          overlay.style.display = 'block';
        });
        
        closeButton.addEventListener('click', () => {
          panel.style.display = 'none';
          overlay.style.display = 'none';
        });
        
        overlay.addEventListener('click', () => {
          panel.style.display = 'none';
          overlay.style.display = 'none';
        });
        
        // Load feedback content
        loadFeedbackContent();
      }
      
      // Load the feedback content
      async function loadFeedbackContent() {
        // Existing implementation...
        debugLog('Loading feedback content');
        const contentDiv = document.getElementById('ai-feedback-content');
        
        try {
          let response;
        
          response = await fetch('./llm_feedback.json');
          
          if (!response || !response.ok) {
            throw new Error('Could not load LLM feedback');
          }
          
          const data = await response.json();
          debugLog('Feedback loaded:', data);
          
          // Use markdown-it if available
          if (window.markdownit) {
            const md = window.markdownit();
            contentDiv.innerHTML = md.render(data.feedback);
          } else {
            // Fallback to basic formatting
            contentDiv.innerHTML = data.feedback.replace(/\\n/g, '<br>');
          }
        } catch (error) {
          debugLog('Error loading feedback:', error);
          contentDiv.innerHTML = '<p>Failed to load AI analysis. Please try refreshing the page.</p>';
        }
      }
      
      // Initialize when DOM is fully loaded
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createFeedbackUI);
      } else {
        createFeedbackUI();
      }
    })();
  `;
  }
};

module.exports = reportInjector;
