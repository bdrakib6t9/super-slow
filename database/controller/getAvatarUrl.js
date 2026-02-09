const axios = require("axios");
const fs = require("fs");
const path = require("path");

/**
 * Download avatar via API and return local file path
 * @param {string} uid
 * @returns {Promise<string|null>}
 */
async function getAvatarUrl(uid) {
  if (!uid) return null;

  try {
    const cacheDir = path.join(__dirname, "..", "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const filePath = path.join(cacheDir, `avatar_${uid}.jpg`);

    // already cached
    if (fs.existsSync(filePath)) return filePath;

    const res = await axios.get(
      "https://rakib-api.vercel.app/api/fb-avatar",
      {
        params: {
          uid,
          apikey: process.env.RAKIB_API_KEY || "rakib69"
        },
        responseType: "stream",
        timeout: 15000
      }
    );

    const writer = fs.createWriteStream(filePath);

    res.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    return filePath;

  } catch (e) {
    console.error("getAvatarUrl error:", e.message);
    return null;
  }
}

module.exports = { getAvatarUrl };
