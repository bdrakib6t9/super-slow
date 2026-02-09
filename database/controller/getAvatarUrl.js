const axios = require("axios");
const fs = require("fs");
const path = require("path");

/**
 * Download avatar via API and return local file path
 * @param {string} uid
 * @returns {string|null}
 */
async function getAvatarUrl(uid) {
  if (!uid || isNaN(uid)) return null;

  try {
    const cacheDir = path.join(__dirname, "..", "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const filePath = path.join(cacheDir, `avatar_${uid}.jpg`);

    const res = await axios.get(
      "https://rakib-api.vercel.app/api/fb-avatar",
      {
        params: {
          uid,
          apikey: "rakib69"
        },
        responseType: "arraybuffer",
        timeout: 10000
      }
    );

    fs.writeFileSync(filePath, res.data);

    return filePath; // 🔑 JUST PATH

  } catch (e) {
    console.error("getAvatarUrl error:", e.message);
    return null;
  }
}

module.exports = { getAvatarUrl };
