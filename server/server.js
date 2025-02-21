const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const backstop = require("backstopjs");

const app = express();
app.use(cors());
app.use(bodyParser.json());

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
  const datetime = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') + '-' +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');

  // Update backstop.json with the provided URLs
  const backstopConfig = {
    id: "ui_comparison",
    viewports: [{ label: viewportType || "desktop", ...viewport }],
    scenarios: [
      {
        label: "UI Comparison",
        url: testUrl,
        referenceUrl: referenceUrl,
        selectors: ["document"],
        misMatchThreshold: 0.1,
        requireSameDimensions: true,
      },
    ],
    paths: {
      bitmaps_reference: "backstop_data/bitmaps_reference/" + datetime,
      bitmaps_test: "backstop_data/bitmaps_test",
      html_report: "backstop_data/html_report",
      json_report: "backstop_data/json_report",
    },
    report: ["browser"],
    engine: "playwright",
    engineOptions: { browser: "chromium", args: ["--no-sandbox"] },
    asyncCaptureLimit: 5,
    asyncCompareLimit: 50,
  };

  fs.writeFileSync(
    BACKSTOP_CONFIG_PATH,
    JSON.stringify(backstopConfig, null, 2)
  );

  backstop("reference")
    .then(() => {
      backstop("test")
        .then(() => {
          return res.json({
            message: "Comparison complete",
            reportUrl: `file:///${process
              .cwd()
              .replace(/\\/g, "/")}/backstop_data/html_report/index.html`,
          });
        })
        .catch((error) => {
          console.error(`Error: ${error}`);

          if (error.message.includes("Mismatch errors found")) {
            return res.json({
              message: "Comparison complete with differences",
              reportUrl: `file:///${process
                .cwd()
                .replace(/\\/g, "/")}/backstop_data/html_report/index.html`,
            });
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

// Start server
const PORT = 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
