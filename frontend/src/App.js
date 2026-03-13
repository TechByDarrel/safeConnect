import React, { useState, useEffect } from "react";
import "./App.css";
import logo from "./assets/safeconnect.png";

import { FaSearch, FaFlag, FaMoon, FaSun } from "react-icons/fa";

const API_BASE = "https://safeconnect-api.onrender.com/api";

const words = [
  "Phishing Attacks",
  "Investment Scams",
  "Fake Loan Apps",
  "Crypto Fraud",
  "WhatsApp Scammers",
];

export default function App() {
  const [search, setSearch] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [animatedText, setAnimatedText] = useState(words[0]);
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  const [reportTarget, setReportTarget] = useState("");
  const [reportCountry, setReportCountry] = useState("");
  const [reportDesc, setReportDesc] = useState("");

  const [stats, setStats] = useState({
    totalReports: 0,
    countriesAffected: 0,
    recentReportsCount: 0,
  });

  useEffect(() => {
    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % words.length;
      setAnimatedText(words[index]);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const handleSearch = async () => {
    if (!search.trim()) {
      alert("Enter a phone number, link, or business.");
      return;
    }

    setScanning(true);
    setScanResult(null);

    try {
      const res = await fetch(
        `${API_BASE}/analyze/${encodeURIComponent(search)}`
      );

      const data = await res.json();

      setTimeout(() => {
        setScanResult(data);
        setScanning(false);
      }, 1500);
    } catch {
      alert("Error analyzing target");
      setScanning(false);
    }
  };

  const handleReport = async () => {
    if (!reportTarget || !reportDesc) {
      alert("Fill all fields");
      return;
    }

    try {
      await fetch(`${API_BASE}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: reportTarget,
          type: reportDesc,
          country: reportCountry || "Unknown",
        }),
      });

      setReportTarget("");
      setReportCountry("");
      setReportDesc("");
      alert("Report submitted");
    } catch {
      alert("Report failed");
    }
  };

  return (
    <div className={darkMode ? "App dark" : "App"}>
      <nav className="navbar">
        <div className="brand">
          <img src={logo} alt="SafeConnect logo" className="brand-logo" />
          <h2>SafeConnect</h2>
        </div>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#verify">Verify</a>
          <a href="#report">Report</a>
        </div>

        <button className="mode-btn" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>
      </nav>

      <section className="hero">
        <p className="hero-intro">
          Protect yourself from online fraud with real-time trust intelligence
        </p>

        <h1>
          SafeConnect detects <span>{animatedText}</span>
        </h1>

        <p className="hero-sub">
          Verify links, services, businesses or people online and get a
          real-time trust score.
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
            <h3>{stats.recentReportsCount}</h3>
            <p>Recent Reports</p>
          </div>
        </div>
      </section>

      <section id="verify" className="section center">
        <h2>
          <FaSearch /> Verify a Target
        </h2>

        <input
          type="text"
          placeholder="Enter phone number, link or company"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button onClick={handleSearch}>Check Trust Score</button>

        {scanning && <p className="scan">Scanning database...</p>}

        {scanResult && (
          <div className="risk-card">
            <h3>AI Trust Analysis</h3>

            <div className="trust-score">
              <div className="score-circle">{scanResult.trustScore}</div>

              <div className="score-info">
                <p>
                  <strong>Risk Level:</strong> {scanResult.risk}
                </p>
                <p>
                  <strong>Reports:</strong> {scanResult.reports}
                </p>
                <p>
                  <strong>Reason:</strong> {scanResult.reason}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section id="report" className="section center">
        <h2>
          <FaFlag /> Report Suspicious Activity
        </h2>

        <input
          type="text"
          placeholder="Scammer number or link"
          value={reportTarget}
          onChange={(e) => setReportTarget(e.target.value)}
        />

        <input
          type="text"
          placeholder="Country"
          value={reportCountry}
          onChange={(e) => setReportCountry(e.target.value)}
        />

        <textarea
          placeholder="Describe the scam"
          rows="4"
          value={reportDesc}
          onChange={(e) => setReportDesc(e.target.value)}
        />

        <button onClick={handleReport}>Submit Report</button>
      </section>

      <footer className="footer">
        <p>© 2026 SafeConnect</p>
      </footer>
    </div>
  );
} 