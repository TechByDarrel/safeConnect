  import React, { useState, useEffect } from "react";
import "./App.css";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { FaSearch, FaFlag, FaShieldAlt, FaMoon, FaSun } from "react-icons/fa";

const API_BASE = "http://localhost:5000/api";

const words = [
  "Phishing Attacks",
  "Investment Scams",
  "Fake Loan Apps",
  "Crypto Fraud",
  "WhatsApp Scammers",
];

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const countryCoordinates = {
  nigeria: [9.082, 8.6753],
  "united kingdom": [55.3781, -3.4360],
  "united states": [37.0902, -95.7129],
  india: [20.5937, 78.9629],
  canada: [56.1304, -106.3468],
  ghana: [7.9465, -1.0232],
  kenya: [-0.0236, 37.9062],
  "south africa": [-30.5595, 22.9375],
  unknown: [20, 0],
};

function App() {
  const [search, setSearch] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [text, setText] = useState(words[0]);
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  const [reportNumber, setReportNumber] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportCountry, setReportCountry] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  const [mapReports, setMapReports] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [stats, setStats] = useState({
    totalReports: 0,
    countriesAffected: 0,
    highRiskTargets: 0,
    recentReportsCount: 0,
  });

  useEffect(() => {
    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % words.length;
      setText(words[index]);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const buildDerivedData = (reports) => {
    const mappedReports = reports.map((report) => {
      const countryKey = (report.country || "Unknown").toLowerCase();
      const position =
        countryCoordinates[countryKey] || countryCoordinates["unknown"];

      return {
        id: report.id,
        target: report.target || "Unknown target",
        type: report.type || "Reported scam",
        country: report.country || "Unknown",
        position,
      };
    });

    setMapReports(mappedReports);
    setRecentReports(reports.slice().reverse().slice(0, 6));

    const totalReports = reports.length;

    const countries = new Set(
      reports.map((item) => (item.country || "Unknown").toLowerCase())
    );

    const targetCounts = {};
    reports.forEach((item) => {
      const target = (item.target || "").toLowerCase();
      if (!target) return;
      targetCounts[target] = (targetCounts[target] || 0) + 1;
    });

    const highRiskTargets = Object.values(targetCounts).filter(
      (count) => count >= 3
    ).length;

    const recentReportsCount = reports.slice(-5).length;

    setStats({
      totalReports,
      countriesAffected: countries.size,
      highRiskTargets,
      recentReportsCount,
    });
  };

  const loadAllReports = async () => {
    try {
      const response = await fetch(`${API_BASE}/reports`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load reports");
      }

      buildDerivedData(data);
    } catch (error) {
      console.error("Failed to load reports:", error);
    }
  };

  useEffect(() => {
    loadAllReports();

    const interval = setInterval(() => {
      loadAllReports();
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async () => {
    const cleanedSearch = search.trim().toLowerCase();

    if (!cleanedSearch) {
      alert(
        "Please enter a phone number, link, business, company, service, or username."
      );
      return;
    }

    setScanning(true);
    setScanResult(null);

    try {
      const response = await fetch(
        `${API_BASE}/analyze/${encodeURIComponent(cleanedSearch)}`
      );
      const data = await response.json();

      setTimeout(() => {
        if (!response.ok) {
          console.error("Analyze error:", data.error);
          alert(data.error || "Something went wrong while analyzing.");
          setScanning(false);
          return;
        }

        setScanResult(data);
        setScanning(false);
      }, 2000);
    } catch (error) {
      console.error("Search error:", error);
      setScanning(false);
      alert("Something went wrong while analyzing the target.");
    }
  };

  const handleReport = async () => {
    const cleanedReport = reportNumber.trim().toLowerCase();
    const cleanedDesc = reportDesc.trim();
    const cleanedCountry = reportCountry.trim();

    if (!cleanedReport || !cleanedDesc) {
      setReportStatus(
        "Please enter both the suspicious target and description."
      );
      return;
    }

    setReportLoading(true);
    setReportStatus("");

    try {
      const response = await fetch(`${API_BASE}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: cleanedReport,
          type: cleanedDesc,
          country: cleanedCountry || "Unknown",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit report.");
      }

      setReportStatus("Report submitted successfully.");
      setReportNumber("");
      setReportDesc("");
      setReportCountry("");

      await loadAllReports();
    } catch (error) {
      console.error("Report error:", error);
      setReportStatus(
        "Failed to submit report. Check backend or internet connection."
      );
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className={darkMode ? "App dark" : "App"}>
      <nav className="navbar">
        <h2>
          <FaShieldAlt /> SafeConnect
        </h2>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#check">Check</a>
          <a href="#report">Report</a>
          <a href="#map">Map</a>
        </div>

        <button className="mode-btn" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>
      </nav>

      <section id="home" className="hero">
        <p className="hero-intro">
          Protect yourself from online fraud with real-time trust intelligence
        </p>

        <h1>
          SafeConnect detects <span>{text}</span>
        </h1>

        <p className="hero-sub">
          Verify links, services, businesses, companies, or people online and
          get a real-time trust score before engaging.
        </p>
      </section>

      <section className="section">
        <h2>📊 Dashboard Overview</h2>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>{stats.totalReports}</h3>
            <p>Total Reports</p>
          </div>

          <div className="stat-card">
            <h3>{stats.countriesAffected}</h3>
            <p>Countries Affected</p>
          </div>

          <div className="stat-card">
            <h3>{stats.highRiskTargets}</h3>
            <p>High Risk Targets</p>
          </div>

          <div className="stat-card">
            <h3>{stats.recentReportsCount}</h3>
            <p>Recent Reports</p>
          </div>
        </div>
      </section>

      <section id="check" className="section center">
        <h2>
          <FaSearch /> Verify a Target
        </h2>

        <input
          type="text"
          placeholder="Enter a phone number, link, business, company, service, or username"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button onClick={handleSearch}>Check Trust Score</button>

        {scanning && (
          <div className="scan-animation">
            <p>Scanning database...</p>
            <p>Checking fraud patterns...</p>
            <p>Analyzing trust signals...</p>
          </div>
        )}

        {scanResult && (
          <div className={`risk-card ${scanResult.risk.toLowerCase()}`}>
            <h3>AI Trust Analysis</h3>

            <div className="risk-meter">
              <div
                className={`risk-meter-fill ${scanResult.risk.toLowerCase()}`}
                style={{ width: `${scanResult.confidence}%` }}
              ></div>
            </div>

            <p>
              <strong>Entity Type:</strong> {scanResult.entityType || "general"}
            </p>
            <p>
              <strong>Risk Level:</strong> {scanResult.risk}
            </p>
            <p>
              <strong>Trust Score:</strong> {scanResult.trustScore}/100
            </p>
            <p>
              <strong>Confidence:</strong> {scanResult.confidence}%
            </p>
            <p>
              <strong>Reports:</strong> {scanResult.reports}
            </p>
            <p>
              <strong>Type:</strong> {scanResult.type}
            </p>
            <p>
              <strong>Country:</strong> {scanResult.country}
            </p>
            <p>
              <strong>Reason:</strong> {scanResult.reason}
            </p>

            {scanResult.checkedUrl && (
              <p>
                <strong>Checked URL:</strong> {scanResult.checkedUrl}
              </p>
            )}
          </div>
        )}
      </section>

      <section id="report" className="section center">
        <h2>
          <FaFlag /> Report Suspicious Activity
        </h2>

        <input
          type="text"
          placeholder="Scammer number, suspicious link, business, service, or username"
          value={reportNumber}
          onChange={(e) => setReportNumber(e.target.value)}
        />

        <input
          type="text"
          placeholder="Country (optional)"
          value={reportCountry}
          onChange={(e) => setReportCountry(e.target.value)}
        />

        <textarea
          placeholder="Describe the suspicious activity, scam attempt, fake business, or fraudulent service..."
          rows="5"
          value={reportDesc}
          onChange={(e) => setReportDesc(e.target.value)}
        ></textarea>

        <button onClick={handleReport}>Submit Report</button>

        {reportLoading && <p>Submitting report...</p>}
        {reportStatus && <p className="report-status">{reportStatus}</p>}
      </section>

      <section className="section">
        <h2>⚡ Live Scam Reports (Auto-updating)</h2>

        <div className="live-feed">
          {recentReports.length === 0 && (
            <p style={{ textAlign: "center", opacity: 0.6 }}>
              No scam reports yet. Be the first to report one.
            </p>
          )}

          {recentReports.map((report) => (
            <div key={report.id} className="report-card">
              <div className="report-card-top">
                <span className="report-badge">LIVE</span>
                <small className="report-country">{report.country}</small>
              </div>

              <h3>{report.target}</h3>
              <p>{report.type}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="map" className="section">
        <h2>🌍 Global Scam Map</h2>

        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: "450px", width: "100%", borderRadius: "10px" }}
        >
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {mapReports.map((report) => (
            <Marker key={report.id} position={report.position}>
              <Popup>
                <strong>{report.target}</strong>
                <br />
                {report.type}
                <br />
                {report.country}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </section>

      <footer className="footer">
        <p>© 2026 SafeConnect | Protecting People from Scams</p>
      </footer>
    </div>
  );
}

export default App; 