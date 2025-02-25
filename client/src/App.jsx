import { useState } from "react";
import "./App.css";

function App() {
  const [referenceUrl, setReferenceUrl] = useState("");
  const [testUrl, setTestUrl] = useState("");
  const [viewportType, setViewportType] = useState("desktop");
  const [loading, setLoading] = useState(false);
  const [reportId, setReportId] = useState(null);

  const serverBaseUrl = "http://localhost:5000";

  const handleCompare = async () => {
    setLoading(true);
    setReportId(null);
    try {
      const response = await fetch(`${serverBaseUrl}/compare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ referenceUrl, testUrl, viewportType }),
      });
      const data = await response.json();
      setReportId(data.reportId);
    } catch (error) {
      alert("Error running BackstopJS comparison", error.message);
    }
    setLoading(false);
  };

  return (
    <>
      <h1>Visual Diff</h1>
      <div className="card">
        <p>Provide the URLs of the web pages that you want to compare.</p>
        <input
          type="text"
          placeholder="Reference URL"
          value={referenceUrl}
          onChange={(e) => setReferenceUrl(e.target.value)}
          className="url-input"
        />
        <br />
        <input
          type="text"
          placeholder="Test URL"
          value={testUrl}
          onChange={(e) => setTestUrl(e.target.value)}
          className="url-input"
        />
        <br />
        <select
          value={viewportType}
          onChange={(e) => setViewportType(e.target.value)}
          className="viewport-select"
        >
          <option value="desktop">Desktop</option>
          <option value="laptop">Laptop</option>
          <option value="tablet">Tablet</option>
          <option value="mobile">Mobile</option>
          <option value="mobileSmall">Mobile Small</option>
        </select>
        <br />
        <button
          onClick={handleCompare}
          disabled={loading}
          className="compare-button"
        >
          {loading ? "Comparing..." : "Compare"}
        </button>

        {reportId && (
          <div>
            <a href={`${serverBaseUrl}/reports/${reportId}`} target="_blank" rel="noopener noreferrer">
              Open Report
            </a>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
