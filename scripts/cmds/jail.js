const { getStreamFromURL } = global.utils;
const Jimp = require("jimp");
const { Readable } = require("stream");

/**
 * @author Rakib
 * Jail command – PURE JIMP (no external image)
 */

module.exports = {
  config: {
    name: "jail",
    version: "4.0",
    author: "Rakib",
    role: 0,
    category: "fun",
    cooldown: 10,
    guide: "{prefix}jail @mention | reply | UID"
  },

  onStart: async function ({ event, message, usersData }) {
    try {
      const { messageReply, mentions, args } = event;

      // -------------------------
      // TARGET
      // -------------------------
      let targetID =
        messageReply?.senderID ||
        Object.keys(mentions || {})[0] ||
        args[0];

      if (!targetID) {
        return message.reply("❌ কাউকে reply / mention / UID দিন।");
      }

      // -------------------------
      // USER DATA
      // -------------------------
      const name = await usersData.getName(targetID).catch(() => "User");
      const avatarUrl = await usersData.getAvatarUrl(targetID).catch(() => null);

      if (!avatarUrl) {
        return message.reply("❌ Avatar পাওয়া যায়নি।");
      }

      // -------------------------
      // STREAM → BUFFER
      // -------------------------
      const streamToBuffer = (stream) =>
        new Promise((resolve, reject) => {
          const chunks = [];
          stream.on("data", c => chunks.push(c));
          stream.on("end", () => resolve(Buffer.concat(chunks)));
          stream.on("error", reject);
        });

      const avatarStream = await getStreamFromURL(avatarUrl);
      const avatarBuffer = await streamToBuffer(avatarStream);

      // -------------------------
      // BASE IMAGE
      // -------------------------
      let img = await Jimp.read(avatarBuffer);
      img.resize(500, 500).grayscale().contrast(0.2);

      // -------------------------
      // DRAW JAIL BARS (PURE JIMP)
      // -------------------------
      const barColor = Jimp.rgbaToInt(0, 0, 0, 180);
      const barWidth = 18;
      const gap = 45;

      for (let x = 0; x < img.bitmap.width; x += gap) {
        for (let y = 0; y < img.bitmap.height; y++) {
          for (let w = 0; w < barWidth; w++) {
            img.setPixelColor(barColor, x + w, y);
          }
        }
      }

      // top & bottom bars
      img.scan(0, 0, img.bitmap.width, 25, (_, __, idx) => {
        img.bitmap.data.writeUInt32BE(barColor, idx);
      });
      img.scan(0, img.bitmap.height - 25, img.bitmap.width, 25, (_, __, idx) => {
        img.bitmap.data.writeUInt32BE(barColor, idx);
      });

      // -------------------------
      // EXPORT
      // -------------------------
      const outBuffer = await img.getBufferAsync(Jimp.MIME_PNG);
      const stream = Readable.from(outBuffer);
      stream.path = "jail.png";

      return message.reply({
        body: `🚔 ${name} এখন জেলে 🔒`,
        attachment: stream
      });

    } catch (err) {
      console.error("JAIL FINAL ERROR:", err);
      return message.reply("❌ Jail command failed, lagau msg TESSA ke.");
    }
  }
};
