const { getStreamFromURL } = global.utils;
const Jimp = require("jimp");
const { Readable } = require("stream");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

/**
 * @author Rakib
 * Jail command (API FREE + AUTO CACHE)
 */

async function getJailOverlay() {
  const cacheDir = path.join(__dirname, "cache");
  const filePath = path.join(cacheDir, "jail.png");

  // cache folder না থাকলে বানাবে
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  // আগেই ডাউনলোড থাকলে সেটাই রিটার্ন
  if (fs.existsSync(filePath)) {
    return filePath;
  }

  // না থাকলে এখন ডাউনলোড করবে (Imgur)
  const url = "https://i.imgur.com/4M34hi2.png";
  const res = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(filePath, res.data);

  return filePath;
}

module.exports = {
  config: {
    name: "jail",
    aliases: [],
    version: "3.0",
    author: "Rakib",
    role: 0,
    category: "fun",
    cooldown: 10,
    guide: "{prefix}jail @mention | reply | UID"
  },

  onStart: async function ({ event, message, usersData }) {
    try {
      const { senderID, messageReply, mentions, args } = event;

      // -------------------------
      // TARGET SYSTEM
      // -------------------------
      let targetID = null;

      if (messageReply) {
        targetID = messageReply.senderID;
      } else if (mentions && Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
      } else if (args[0]) {
        targetID = args[0];
      }

      if (!targetID) {
        return message.reply("❌ কাউকে reply / mention / UID দিন।");
      }

      // -------------------------
      // USER DATA
      // -------------------------
      let name = await usersData.getName(targetID).catch(() => "User");
      let avatarUrl = await usersData.getAvatarUrl(targetID).catch(() => null);

      if (!avatarUrl) {
        return message.reply("❌ ইউজারের avatar পাওয়া যায়নি।");
      }

      // -------------------------
      // HELPER: stream → buffer
      // -------------------------
      const streamToBuffer = (stream) =>
        new Promise((resolve, reject) => {
          const chunks = [];
          stream.on("data", c => chunks.push(c));
          stream.on("end", () => resolve(Buffer.concat(chunks)));
          stream.on("error", reject);
        });

      // -------------------------
      // LOAD AVATAR
      // -------------------------
      const avatarStream = await getStreamFromURL(avatarUrl);
      const avatarBuffer = await streamToBuffer(avatarStream);
      let avatar = await Jimp.read(avatarBuffer);
      avatar = avatar.resize(500, 500);

      // -------------------------
      // LOAD JAIL OVERLAY (AUTO CACHE)
      // -------------------------
      const jailPath = await getJailOverlay();
      const jail = await Jimp.read(jailPath);
      jail.resize(500, 500);

      // -------------------------
      // COMPOSITE
      // -------------------------
      avatar.composite(jail, 0, 0);

      // -------------------------
      // EXPORT
      // -------------------------
      const outBuffer = await avatar.getBufferAsync(Jimp.MIME_PNG);
      const imgStream = Readable.from(outBuffer);
      imgStream.path = "jail.png";

      return message.reply({
        body: `🚔 ${name} এখন জেলে 🔒`,
        attachment: imgStream
      });

    } catch (err) {
      console.error(err);
      return message.reply("❌ Jail command failed. api error please contact tessa");
    }
  }
};
