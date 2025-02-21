import { useState } from "react";
import "./App.css";

function App() {
  const [referenceUrl, setReferenceUrl] = useState("");
  const [testUrl, setTestUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportUrl, setReportUrl] = useState(null);
  const [viewportType, setViewportType] = useState("desktop");

  const handleCompare = async () => {
    setLoading(true);
    setReportUrl(null);
    try {
      const response = await fetch("http://localhost:5000/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ referenceUrl, testUrl, viewportType }),
      });
      const data = await response.json();
      setReportUrl(data.reportUrl);
    } catch (error) {
      alert("Error running BackstopJS comparison", error.message);
    }
    setLoading(false);
  };

  return (
    <>
      <h1>Visual Diff</h1>
      <div className="card">
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

        {reportUrl && (
          <div>
            <a href={`${reportUrl}`} target="_blank" rel="noopener noreferrer">
              Open Report
            </a>
          </div>
        )}

        <p>Provide the URLs of the web pages that you want to compare.</p>
      </div>
    </>
  );
}

export default App;
