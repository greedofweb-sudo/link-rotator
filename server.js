/**
 * 🔗 Affiliate Link Rotator
 * 
 * Every N clicks (default: 3), this server:
 * 1. Generates a brand new short link via your chosen API
 * 2. Instantly redirects all visitors through the current short link
 * 3. Logs every click with timestamp + active short URL
 * 
 * Supports: Short.io, Rebrandly, Bitly (switchable via config)
 */

const http = require("http");
const https = require("https");
const fs = require("fs");

// ============================================================
// ✏️  CONFIG — Fill these in before running
// ============================================================
const CONFIG = {
  DESTINATION_URL: process.env.DESTINATION_URL,
  PROVIDER: "shortio",
  PORT: process.env.PORT || 3000,
  ROTATE_EVERY: parseInt(process.env.ROTATE_EVERY) || 3,
  SHORTIO: {
    API_KEY: process.env.SHORTIO_API_KEY,
    DOMAIN: process.env.SHORTIO_DOMAIN,
  },
};
// ============================================================

// --- State: tracks current short link and click count ---
let state = {
  currentShortURL: null,  // The active short link being used
  clickCount: 0,          // Clicks on the current short link
  isGenerating: false,    // Prevents double-generation under traffic
};

// --- Shortener API functions ---

function createShortio(destination) {
  return apiRequest({
    hostname: "api.short.io",
    path: "/links",
    method: "POST",
    headers: {
      authorization: CONFIG.SHORTIO.API_KEY,
      "content-type": "application/json",
    },
    body: {
      domain: CONFIG.SHORTIO.DOMAIN,
      originalURL: destination,
    },
    extract: (data) => data.shortURL,
  });
}


// --- Generic HTTPS request helper ---
function apiRequest({ hostname, path, method, headers, body, extract }) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const options = {
      hostname,
      path,
      method,
      headers: { ...headers, "content-length": Buffer.byteLength(bodyStr) },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          const url = extract(parsed);
          if (!url) return reject(new Error("No URL in response: " + data));
          resolve(url);
        } catch (e) {
          reject(new Error("Parse error: " + data));
        }
      });
    });

    req.on("error", reject);
    req.write(bodyStr);
    req.end();
  });
}

// --- Pick provider ---
function generateShortLink(destination) {
  switch (CONFIG.PROVIDER) {
    case "shortio":    return createShortio(destination);
    default: throw new Error("Unknown provider: " + CONFIG.PROVIDER);
  }
}

// --- Logger ---
function logClick(shortURL, ip, clickNum) {
  const entry = `[${new Date().toISOString()}] IP: ${ip} | Click #${clickNum} on current link → ${shortURL}\n`;
  fs.appendFileSync("clicks.log", entry);
  console.log(entry.trim());
}

// --- Generate and store a new short link ---
async function refreshShortLink() {
  if (state.isGenerating) return; // Avoid race condition
  state.isGenerating = true;
  try {
    console.log(`🔄 Rotating short link after ${CONFIG.ROTATE_EVERY} clicks...`);
    const newURL = await generateShortLink(CONFIG.DESTINATION_URL);
    state.currentShortURL = newURL;
    state.clickCount = 0;
    console.log(`✅ New short link active: ${newURL}`);
  } catch (err) {
    console.error("❌ Failed to generate new short link:", err.message);
  } finally {
    state.isGenerating = false;
  }
}

// --- HTTP Server ---
const server = http.createServer(async (req, res) => {
  // Only handle the root path
  if (req.url !== "/" && req.url !== "") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  // Generate first short link on startup if we don't have one yet
  if (!state.currentShortURL) {
    try {
      console.log("⏳ Generating initial short link...");
      await refreshShortLink();
    } catch (err) {
      console.error("❌ Could not generate initial link:", err.message);
      res.writeHead(302, { Location: CONFIG.DESTINATION_URL });
      res.end();
      return;
    }
  }

  // Increment click count and redirect through current short link
  state.clickCount++;
  const redirectURL = state.currentShortURL;
  logClick(redirectURL, ip, state.clickCount);

  res.writeHead(302, { Location: redirectURL });
  res.end();

  // After redirect, check if we've hit the rotation threshold
  if (state.clickCount >= CONFIG.ROTATE_EVERY) {
    refreshShortLink(); // Async — generates next link in background
  }
});

server.listen(CONFIG.PORT, () => {
  console.log(`
✅ Link Rotator running!
🔗 Your master link: http://localhost:${CONFIG.PORT}
📍 Destination:      ${CONFIG.DESTINATION_URL}
🔀 Provider:         ${CONFIG.PROVIDER}
🔄 Rotates every:    ${CONFIG.ROTATE_EVERY} clicks
📄 Clicks logged to: clicks.log
  `);
});
