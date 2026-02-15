const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "slap",
    version: "4.0",
    author: "Rakib",
    countDown: 5,
    role: 0,
    shortDescription: "Custom slap image with circular avatars",
    longDescription: "Custom slap image using drive template and circular avatars",
    category: "FUN & GAME",
    guide: { en: "{pn} @tag" }
  },

  langs: {
    en: { noTag: "যারে থাপড়াবি ওরে মেনশন দে 😒" }
  },

  onStart: async function ({ event, message, usersData, getLang }) {

    const uid1 = event.senderID;
    const mentions = Object.keys(event.mentions || {});
    const uid2 = mentions[0];

    if (!uid2)
      return message.reply(getLang("noTag"));

    try {

      // 🖼️ Avatar URL (local cache system)
      const avatar1 = await usersData.getAvatarUrl(uid1);
      const avatar2 = await usersData.getAvatarUrl(uid2);

      if (!avatar1 || !avatar2)
        return message.reply("❌ Avatar পাওয়া যায়নি।");

      // 🖼️ Background from Drive
      const bgURL =
        "https://drive.google.com/uc?export=download&id=1e10wHiZ8KgbYJQutjE-FTAMucQVSKnIH";

      const bgStream = await getStreamFromURL(bgURL);
      const bgBuffer = await streamToBuffer(bgStream);

      const [template, img1, img2] = await Promise.all([
        loadImage(bgBuffer),
        loadImage(avatar1),
        loadImage(avatar2)
      ]);

      const canvas = createCanvas(template.width, template.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(template, 0, 0);

      // 🔵 Circle avatar function
      function drawCircleAvatar(img, x, y, size) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      }

      // 👋 Position same as your old layout
      drawCircleAvatar(img1, 165, 230, 90);
      drawCircleAvatar(img2, 235, 500, 110);

      const tmpDir = path.join(__dirname, "tmp");
      await fs.ensureDir(tmpDir);

      const filePath = path.join(tmpDir, `slap_${uid1}_${uid2}.png`);
      await fs.writeFile(filePath, canvas.toBuffer("image/png"));

      await message.reply(
        {
          body: "👋 thassssshshhhhh!",
          attachment: fs.createReadStream(filePath)
        },
        () => fs.unlink(filePath).catch(() => {})
      );

      canvas.width = canvas.height = 0;
      global.gc && global.gc();

    } catch (err) {
      console.error("❌ slap error:", err);
      message.reply("⚠️ slap command failed.");
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
