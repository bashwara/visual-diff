const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const backstop = require("backstopjs");
const ULID = require("ulid");

const app = express();
app.use(cors());
app.use(express.json());

// Serve all backstop generated content statically
app.use("/reports", express.static(path.join(__dirname, "backstop_data/html_report")));
app.use("/bitmaps_reference", express.static(path.join(__dirname, "backstop_data/bitmaps_reference")));
app.use("/bitmaps_test", express.static(path.join(__dirname, "backstop_data/bitmaps_test")));

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
        .then(() => {
          return res.json({
            message: "Comparison complete",
            reportId: runId,
          });
        })
        .catch((error) => {
          console.error(`Error: ${error}`);

          if (error.message.includes("Mismatch errors found")) {
            return res.json({
              message: "Comparison complete with differences",
              reportId: runId,
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

// Endpoint to get report by ID
app.get("/reports/:id", (req, res) => {
  const reportId = req.params.id;
  const reportPath = path.join(__dirname, "backstop_data", "html_report", reportId);
  
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
