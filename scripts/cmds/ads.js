const { getStreamFromURL } = global.utils;
const Jimp = require("jimp");
const { Readable } = require("stream");
const fs = require("fs");
const path = require("path");

/**
 * @author Rakib
 * Ads command (API FREE + AUTO CACHE)
 */

// 🔥 auto-cache ad overlay
async function getAdOverlay() {
  const cacheDir = path.join(__dirname, "cache");
  const filePath = path.join(cacheDir, "ad.png");

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  // আগে থেকেই থাকলে সেটাই নেবে
  if (fs.existsSync(filePath)) {
    return filePath;
  }

  // না থাকলে এখান থেকে একবার নামাবে
  const url = "https://i.imgur.com/Q4JZJ9k.png"; // sample ad/tv overlay

  const stream = await getStreamFromURL(url);

  await new Promise((resolve, reject) => {
    const write = fs.createWriteStream(filePath);
    stream.pipe(write);
    stream.on("error", reject);
    write.on("finish", resolve);
    write.on("error", reject);
  });

  return filePath;
}

module.exports = {
  config: {
    name: "ads",
    version: "2.0",
    author: "Rakib",
    role: 0,
    category: "fun",
    cooldown: 10,
    guide: "{prefix}ads @mention | reply | UID"
  },

  onStart: async function ({ event, message, usersData }) {
    // 🔒 author lock
    const obfuscatedAuthor = String.fromCharCode(82, 97, 107, 105, 98);
    if (module.exports.config.author !== obfuscatedAuthor) {
      return message.reply("You are not authorized to change the author name.");
    }

    try {
      const { messageReply, mentions, args } = event;

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
        return message.reply("❌ Mention, reply, or provide UID of the target.");
      }

      // -------------------------
      // USER DATA
      // -------------------------
      const name = await usersData.getName(targetID).catch(() => "User");
      const avatarUrl = await usersData.getAvatarUrl(targetID).catch(() => null);

      if (!avatarUrl) {
        return message.reply("❌ User avatar not found.");
      }

      // helper: stream → buffer
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
      // LOAD AD OVERLAY (AUTO CACHE)
      // -------------------------
      const adPath = await getAdOverlay();
      const ad = await Jimp.read(adPath);
      ad.resize(500, 500);

      // -------------------------
      // COMPOSITE
      // -------------------------
      avatar.composite(ad, 0, 0);

      // -------------------------
      // EXPORT
      // -------------------------
      const outBuffer = await avatar.getBufferAsync(Jimp.MIME_PNG);
      const imgStream = Readable.from(outBuffer);
      imgStream.path = "ads.png";

      return message.reply({
        body: `📺 ${name} is now on Ads!`,
        attachment: imgStream
      });

    } catch (err) {
      console.error("ADS ERROR:", err);
      return message.reply("🥹 Ads command failed. please contact TESSA");
    }
  }
};
