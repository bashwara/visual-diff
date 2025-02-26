const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const backstop = require("backstopjs");
const ULID = require("ulid");
const Anthropic = require("@anthropic-ai/sdk");
require("dotenv").config();

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const app = express();
app.use(cors());
app.use(express.json());

// Serve all backstop generated content statically
app.use(
  "/reports",
  express.static(path.join(__dirname, "backstop_data/html_report"))
);
app.use(
  "/bitmaps_reference",
  express.static(path.join(__dirname, "backstop_data/bitmaps_reference"))
);
app.use(
  "/bitmaps_test",
  express.static(path.join(__dirname, "backstop_data/bitmaps_test"))
);

const BACKSTOP_CONFIG_PATH = "./backstop.json";

const VIEWPORT_MAP = {
  desktop: { width: 1280, height: 800 },
  laptop: { width: 1024, height: 768 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
  mobileSmall: { width: 320, height: 568 },
};

// Endpoint to set URLs and run BackstopJS
app.post("/compare", (req, res) => {
  const { referenceUrl, testUrl, viewportType } = req.body;

  if (!referenceUrl || !testUrl) {
    return res.status(400).json({ error: "Both URLs are required" });
  }

  const viewport = VIEWPORT_MAP[viewportType] || VIEWPORT_MAP.desktop;

  const now = new Date();
  const datetime =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, "0") +
    now.getDate().toString().padStart(2, "0") +
    "-" +
    now.getHours().toString().padStart(2, "0") +
    now.getMinutes().toString().padStart(2, "0") +
    now.getSeconds().toString().padStart(2, "0");

  runId = ULID.ulid();

  console.log("runId:", runId);

  // Update backstop.json with the provided URLs
  const backstopConfig = {
    id: "ui_comparison",
    viewports: [{ label: viewportType || "desktop", ...viewport }],
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

  fs.writeFileSync(
    BACKSTOP_CONFIG_PATH,
    JSON.stringify(backstopConfig, null, 2)
  );

  backstop("reference")
    .then(() => {
      backstop("test")
        .then(async () => {
          // Get reference image path
          const referencePath = path.join(
            __dirname,
            `backstop_data/bitmaps_reference/${runId}/${datetime}/ui_comparison_UI_Comparison_0_document_0_desktop.png`
          );

          // Check if reference image exists
          if (fs.existsSync(referencePath)) {
            try {
              // Convert image to base64
              const imageBuffer = fs.readFileSync(referencePath);
              const base64Image = imageBuffer.toString("base64");

              // Send to Claude
              const response = await anthropic.messages.create({
                model: "claude-3-7-sonnet-latest",
                max_tokens: 4000,
                messages: [
                  {
                    role: "user",
                    content: [
                      {
                        type: "text",
                        text: "Please analyze this UI and suggest UX/UI improvements. Be specific about color, layout, usability, accessibility, and visual design. Format your response with markdown.",
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

              // Extract Claude's response
              const claudeResponse = response.content[0].text;

              // Save the Claude response
              const reportFolderPath = path.join(
                __dirname,
                `backstop_data/html_report/${runId}`
              );
              fs.writeFileSync(
                path.join(reportFolderPath, "claude_feedback.json"),
                JSON.stringify({ feedback: claudeResponse })
              );

              // Inject custom script into report
              injectCustomScriptIntoReport(reportFolderPath);

              return res.json({
                message: "Comparison complete with LLM feedback",
                reportId: runId,
              });
            } catch (err) {
              console.error("Error with LLM feedback:", err);
              return res.json({
                message: "Comparison complete, but LLM feedback failed",
                reportId: runId,
              });
            }
          } else {
            return res.json({
              message: "Comparison complete, reference image not found for LLM",
              reportId: runId,
            });
          }
        })
        .catch(async (error) => {
          console.error(`Error: ${error}`);

          if (error.message.includes("Mismatch errors found")) {
            // Get reference image path
            const referencePath = path.join(
              __dirname,
              `backstop_data/bitmaps_reference/${runId}/${datetime}/ui_comparison_UI_Comparison_0_document_0_desktop.png`
            );

            // Check if reference image exists
            if (fs.existsSync(referencePath)) {
              try {
                // Convert image to base64
                const imageBuffer = fs.readFileSync(referencePath);
                const base64Image = imageBuffer.toString("base64");

                // Send to Claude
                const response = await anthropic.messages.create({
                  model: "claude-3-7-sonnet-latest",
                  max_tokens: 4000,
                  messages: [
                    {
                      role: "user",
                      content: [
                        {
                          type: "text",
                          text: `As a UI/UX expert, analyze this interface and provide actionable feedback:

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

                Format your response with clear markdown headings, bullet points, and where appropriate, code or design specifications.`,
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

                // Extract Claude's response
                const claudeResponse = response.content[0].text;

                // Save the Claude response
                const reportFolderPath = path.join(
                  __dirname,
                  `backstop_data/html_report/${runId}`
                );
                fs.writeFileSync(
                  path.join(reportFolderPath, "claude_feedback.json"),
                  JSON.stringify({ feedback: claudeResponse })
                );

                // Inject custom script into report
                injectCustomScriptIntoReport(reportFolderPath);

                return res.json({
                  message:
                    "Comparison complete with differences with LLM feedback",
                  reportId: runId,
                });
              } catch (err) {
                console.error("Error with LLM feedback:", err);
                return res.json({
                  message: "Comparison complete, but LLM feedback failed",
                  reportId: runId,
                });
              }
            } else {
              return res.json({
                message:
                  "Comparison complete, reference image not found for LLM",
                reportId: runId,
              });
            }
          }

          return res.status(500).json({
            error: "Comparison failed",
            message: error.message,
          });
        });
    })
    .catch((error) => {
      console.error(`Error: ${error}`);

      return res.status(500).json({
        error: "Comparison failed",
        message: error.message,
      });
    });
});

function injectCustomScriptIntoReport(reportFolderPath) {
  // Create custom JS file to inject into report
  const customJs = `
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
        
          response = await fetch('./claude_feedback.json');
          
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

  // Create markdown-it script to handle markdown rendering
  const markdownItScript = `
    <script src="https://cdn.jsdelivr.net/npm/markdown-it@12.0.6/dist/markdown-it.min.js"></script>
  `;

  // Save custom JS file
  fs.writeFileSync(path.join(reportFolderPath, "llm_feedback.js"), customJs);

  // Inject into index.html
  const indexPath = path.join(reportFolderPath, "index.html");
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
}

// Endpoint to get report by ID
app.get("/reports/:id", (req, res) => {
  const reportId = req.params.id;
  const reportPath = path.join(
    __dirname,
    "backstop_data",
    "html_report",
    reportId
  );

  if (!fs.existsSync(reportPath)) {
    return res.status(404).json({ error: "Report not found" });
  }

  res.sendFile(path.join(reportPath, "index.html"));
});

// Start server
const PORT = 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
