const suspiciousKeywords = [
  "investment",
  "crypto",
  "loan",
  "urgent",
  "verify",
  "account",
  "otp",
  "bank",
  "payment",
  "airdrop",
  "forex",
  "giveaway",
  "wallet",
  "upfront",
  "whatsapp",
  "telegram",
];

function calculateAiScore(docs) {
  let score = 0;
  const reasons = [];

  const reportsCount = docs.length;
  const latest = docs[docs.length - 1] || {};

  if (reportsCount >= 10) {
    score += 55;
    reasons.push("High number of reports");
  } else if (reportsCount >= 5) {
    score += 35;
    reasons.push("Multiple scam reports found");
  } else if (reportsCount >= 1) {
    score += 15;
    reasons.push("At least one report found");
  }

  let keywordHits = 0;

  docs.forEach((doc) => {
    const textToCheck = `${doc.type || ""} ${doc.target || ""}`.toLowerCase();

    suspiciousKeywords.forEach((keyword) => {
      if (textToCheck.includes(keyword)) {
        keywordHits += 1;
      }
    });
  });

  if (keywordHits >= 5) {
    score += 30;
    reasons.push("Many suspicious fraud keywords detected");
  } else if (keywordHits >= 2) {
    score += 18;
    reasons.push("Suspicious keywords detected");
  } else if (keywordHits >= 1) {
    score += 8;
    reasons.push("A suspicious keyword was detected");
  }

  if ((latest.country || "").toLowerCase() === "unknown") {
    score += 5;
    reasons.push("Unknown source country");
  }

  const cleanedTarget = (latest.target || "").toLowerCase();

  if (
    cleanedTarget.includes(".com") ||
    cleanedTarget.includes(".net") ||
    cleanedTarget.includes(".org")
  ) {
    score += 8;
    reasons.push("Web-based target detected");
  }

  if (/^\d+$/.test(cleanedTarget.replace(/\s+/g, ""))) {
    score += 5;
    reasons.push("Phone-number target detected");
  }

  if (score > 100) score = 100;

  let risk = "LOW";
  if (score >= 70) {
    risk = "HIGH";
  } else if (score >= 30) {
    risk = "MEDIUM";
  }

  return {
    risk,
    confidence: score,
    reason:
      reasons.length > 0
        ? reasons.join(" • ")
        : "No strong fraud indicators found",
  };
}

module.exports = { calculateAiScore }; 