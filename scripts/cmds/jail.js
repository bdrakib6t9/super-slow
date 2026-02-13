const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const { getAvatarUrl } = require("../../rakib/customApi/getAvatarUrl");
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "jail",
    version: "1.0",
    author: "Rakib",
    countDown: 5,
    role: 0,
    category: "fun",
    guide: "{p}jail @mention | reply | UID"
  },

  onStart: async function ({ message, event }) {
    try {
      const senderID = event.senderID;

      // ✅ target detection
      let targetID =
        event.messageReply?.senderID ||
        Object.keys(event.mentions || {})[0] ||
        event.args?.[0];

      if (!targetID) {
        return message.reply("❌ Please mention, reply or give UID.");
      }

      // ✅ Get local avatar
      const avatarPath = await getAvatarUrl(targetID).catch(() => null);
      if (!avatarPath) {
        return message.reply("❌ Avatar not found.");
      }

      // ✅ Jail overlay image (Google Drive)
      const overlayURL =
        "https://drive.google.com/uc?export=download&id=1aexhSHX74lye7q11bHcy8hDEXlWPFqK1";

      const overlayStream = await getStreamFromURL(overlayURL);
      const overlayBuffer = await streamToBuffer(overlayStream);

      // ✅ Load images
      const avatar = await loadImage(avatarPath);
      const overlay = await loadImage(overlayBuffer);

      // ✅ Create canvas (overlay size based)
      const canvas = createCanvas(overlay.width, overlay.height);
      const ctx = canvas.getContext("2d");

      // 🔵 Draw avatar full background
      ctx.drawImage(avatar, 0, 0, canvas.width, canvas.height);

      // 🔒 Draw jail overlay ON TOP
      ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height);

      // ✅ Save temp
      const tmpDir = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

      const outputPath = path.join(tmpDir, `jail_${Date.now()}.png`);
      fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));

      return message.reply(
        {
          body: "🚔 You are now in Jail 🔒",
          attachment: fs.createReadStream(outputPath)
        },
        () => fs.unlinkSync(outputPath)
      );

    } catch (err) {
      console.error("jail error:", err);
      return message.reply("❌ Jail command failed.");
    }
  }
};

// helper
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", c => chunks.push(c));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
        }
