require("dotenv").config();

const express = require("express");
const crypto = require("crypto");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

const db = new Database("verification.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id TEXT,
    username TEXT,
    first_name TEXT,
    ip TEXT,
    user_agent TEXT,
    language TEXT,
    screen_width INTEGER,
    screen_height INTEGER,
    timezone TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

function validateTelegramInitData(initData) {
  if (!initData || !process.env.BOT_TOKEN) {
    return null;
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) {
    return null;
  }

  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(process.env.BOT_TOKEN)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (
    calculatedHash.length !== hash.length ||
    !crypto.timingSafeEqual(
      Buffer.from(calculatedHash),
      Buffer.from(hash)
    )
  ) {
    return null;
  }

  const user = params.get("user");

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return req.socket.remoteAddress || "";
}

app.post("/api/verify", (req, res) => {
  try {
    const {
      initData,
      language,
      screenWidth,
      screenHeight,
      timezone
    } = req.body;

    const telegramUser = validateTelegramInitData(initData);

    if (!telegramUser) {
      return res.status(401).json({
        success: false,
        message: "Telegram verification failed"
      });
    }

    const ip = getClientIp(req);
    const userAgent = req.headers["user-agent"] || "";

    const statement = db.prepare(`
      INSERT INTO verifications (
        telegram_id,
        username,
        first_name,
        ip,
        user_agent,
        language,
        screen_width,
        screen_height,
        timezone
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    statement.run(
      String(telegramUser.id),
      telegramUser.username || "",
      telegramUser.first_name || "",
      ip,
      userAgent,
      language || "",
      Number(screenWidth) || 0,
      Number(screenHeight) || 0,
      timezone || ""
    );

    res.json({
      success: true,
      message: "Device verification successful",
      user: {
        id: telegramUser.id,
        username: telegramUser.username || "",
        firstName: telegramUser.first_name || ""
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
