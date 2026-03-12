import React, { useState, useEffect } from "react";
import "./App.css";

/* CHANGE THIS TO YOUR RENDER BACKEND */
const API_BASE = "https://safeconnect-api.onrender.com/api"; 

function App() {
  const [target, setTarget] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [reportTarget, setReportTarget] = useState("");
  const [reportType, setReportType] = useState("Whatsapp Scam");
  const [reportCountry, setReportCountry] = useState("");

  const [reports, setReports] = useState([]);

  /* LOAD REPORTS */
  const loadAllReports = async () => {
    try {
      const res = await fetch(`${API_BASE}/reports`);
      const data = await res.json();
      setReports(data.reverse());
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadAllReports();
  }, []);

  /* CHECK TARGET */
  const checkTarget = async () => {
    if (!target) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/check/${target}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  /* SUBMIT REPORT */
  const submitReport = async () => {
    if (!reportTarget) return;

    try {
      const res = await fetch(`${API_BASE}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: reportTarget,
          type: reportType,
          country: reportCountry,
        }),
      });

      const data = await res.json();
      alert(data.message);

      setReportTarget("");
      setReportCountry("");

      loadAllReports();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="App">

      <h1>SafeConnect</h1>
      <p>Verify links, businesses, services or people online</p>

      {/* CHECK SCAM */}
      <div className="checkBox">
        <h2>Check Target</h2>

        <input
          type="text"
          placeholder="Phone number, website or business"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />

        <button onClick={checkTarget}>Check</button>

        {loading && <p>Searching database...</p>}

        {result && (
          <div className="resultCard">
            <h3>Risk Level: {result.risk}</h3>
            <p>Confidence: {result.confidence}/10</p>
            <p>Reports Found: {result.reports}</p>
            <p>Type: {result.type}</p>
            <p>Country: {result.country}</p>
            <p>{result.reason}</p>
          </div>
        )}
      </div>

      {/* REPORT SCAM */}
      <div className="reportBox">
        <h2>Report Scam</h2>

        <input
          type="text"
          placeholder="Phone, website or business"
          value={reportTarget}
          onChange={(e) => setReportTarget(e.target.value)}
        />

        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
        >
          <option>Whatsapp Scam</option>
          <option>Website Scam</option>
          <option>Business Fraud</option>
          <option>Investment Scam</option>
        </select>

        <input
          type="text"
          placeholder="Country"
          value={reportCountry}
          onChange={(e) => setReportCountry(e.target.value)}
        />

        <button onClick={submitReport}>Submit Report</button>
      </div>

      {/* LIVE REPORTS */}
      <div className="liveReports">
        <h2>Live Scam Reports</h2>

        {reports.length === 0 ? (
          <p>No scam reports yet.</p>
        ) : (
          reports.map((r) => (
            <div key={r.id} className="reportCard">
              <p><strong>Target:</strong> {r.target}</p>
              <p><strong>Type:</strong> {r.type}</p>
              <p><strong>Country:</strong> {r.country}</p>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

export default App; 