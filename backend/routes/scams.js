const express = require("express");
const router = express.Router();

const { admin, db } = require("../firebaseAdmin");
const { calculateAiScore } = require("../utils/scoring");

function looksLikeUrl(target) {
  const value = (target || "").trim().toLowerCase();

  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    /^[a-z0-9-]+\.[a-z]{2,}([/?#].*)?$/.test(value)
  );
}

function normalizeUrl(target) {
  const value = (target || "").trim().toLowerCase();

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}

async function checkSafeBrowsing(url) {
  const apiKey = process.env.SAFE_BROWSING_API_KEY;

  if (!apiKey) {
    return {
      flagged: false,
      provider: "Google Safe Browsing",
      reason: "Safe Browsing API key not configured",
    };
  }

  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;

  const body = {
    client: {
      clientId: "safeconnect",
      clientVersion: "1.0.0",
    },
    threatInfo: {
      threatTypes: [
        "MALWARE",
        "SOCIAL_ENGINEERING",
        "UNWANTED_SOFTWARE",
        "POTENTIALLY_HARMFUL_APPLICATION",
      ],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }],
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Safe Browsing request failed: ${text}`);
  }

  const data = await response.json();

  if (data.matches && data.matches.length > 0) {
    return {
      flagged: true,
      provider: "Google Safe Browsing",
      matches: data.matches,
      reason: "URL matched an unsafe browsing list",
    };
  }

  return {
    flagged: false,
    provider: "Google Safe Browsing",
    reason: "No unsafe URL match found",
  };
}

/* POST /api/report */
router.post("/report", async (req, res) => {
  try {
    const { target, type, country } = req.body;

    if (!target || !type) {
      return res.status(400).json({
        error: "Target and type are required.",
      });
    }

    const docRef = await db.collection("scams").add({
      target: target.trim().toLowerCase(),
      type: type.trim(),
      country: country?.trim() || "Unknown",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      message: "Scam report submitted successfully.",
      id: docRef.id,
    });
  } catch (error) {
    console.error("POST /report error:", error);
    res.status(500).json({ error: "Failed to submit report." });
  }
});

/* GET /api/check/:target */
router.get("/check/:target", async (req, res) => {
  try {
    const target = req.params.target.trim().toLowerCase();

    const snapshot = await db
      .collection("scams")
      .where("target", "==", target)
      .get();

    if (snapshot.empty) {
      return res.json({
        risk: "LOW",
        confidence: 8,
        reason: "No matching reports found in the database",
        reports: 0,
        type: "No known scam pattern",
        country: "Unknown",
      });
    }

    const docs = snapshot.docs.map((doc) => doc.data());
    const latest = docs[docs.length - 1];
    const aiResult = calculateAiScore(docs);

    res.json({
      risk: aiResult.risk,
      confidence: aiResult.confidence,
      reason: aiResult.reason,
      reports: docs.length,
      type: latest.type || "Reported scam activity",
      country: latest.country || "Unknown",
    });
  } catch (error) {
    console.error("GET /check/:target error:", error);
    res.status(500).json({ error: "Failed to check target." });
  }
});

/* GET /api/analyze/:target */
router.get("/analyze/:target", async (req, res) => {
  try {
    const target = req.params.target.trim().toLowerCase();

    const snapshot = await db
      .collection("scams")
      .where("target", "==", target)
      .get();

    const docs = snapshot.docs.map((doc) => doc.data());
    const reports = docs.length;
    const latest = docs[docs.length - 1] || {};

    let firestoreResult = {
      risk: "LOW",
      confidence: 8,
      reason: "No matching reports found in the database",
      reports: 0,
      type: "No known scam pattern",
      country: "Unknown",
    };

    if (reports > 0) {
      const aiResult = calculateAiScore(docs);
      firestoreResult = {
        risk: aiResult.risk,
        confidence: aiResult.confidence,
        reason: aiResult.reason,
        reports,
        type: latest.type || "Reported scam activity",
        country: latest.country || "Unknown",
      };
    }

    const entityType = looksLikeUrl(target) ? "url" : "general";

    if (entityType !== "url") {
      return res.json({
        entityType,
        trustScore: Math.max(0, 100 - firestoreResult.confidence),
        ...firestoreResult,
        externalSignals: [],
      });
    }

    const url = normalizeUrl(target);
    const safeBrowsing = await checkSafeBrowsing(url);

    let finalConfidence = firestoreResult.confidence;
    let finalRisk = firestoreResult.risk;
    let finalReason = firestoreResult.reason;
    const externalSignals = [safeBrowsing];

    if (safeBrowsing.flagged) {
      finalConfidence = Math.min(100, finalConfidence + 45);
      finalRisk = "HIGH";
      finalReason =
        firestoreResult.reason === "No matching reports found in the database"
          ? "Google Safe Browsing flagged this URL as unsafe"
          : `${firestoreResult.reason} • Google Safe Browsing flagged this URL as unsafe`;
    }

    if (finalConfidence >= 70) {
      finalRisk = "HIGH";
    } else if (finalConfidence >= 30 && finalRisk !== "HIGH") {
      finalRisk = "MEDIUM";
    } else if (finalConfidence < 30 && finalRisk !== "HIGH") {
      finalRisk = "LOW";
    }

    res.json({
      entityType,
      trustScore: Math.max(0, 100 - finalConfidence),
      risk: finalRisk,
      confidence: finalConfidence,
      reason: finalReason,
      reports: firestoreResult.reports,
      type: firestoreResult.type,
      country: firestoreResult.country,
      checkedUrl: url,
      externalSignals,
    });
  } catch (error) {
    console.error("GET /analyze/:target error:", error);
    res.status(500).json({ error: "Failed to analyze target." });
  }
});

/* GET /api/reports */
router.get("/reports", async (req, res) => {
  try {
    const snapshot = await db.collection("scams").get();

    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(reports);
  } catch (error) {
    console.error("GET /reports error:", error);
    res.status(500).json({ error: "Failed to load reports." });
  }
});

module.exports = router; 