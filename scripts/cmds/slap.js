const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const { getStreamFromURL } = global.utils;
const { getAvatarUrl } = require("../../rakib/customApi/getAvatarUrl");

module.exports = {
  config: {
    name: "slap",
    version: "5.0",
    author: "Rakib",
    countDown: 5,
    role: 0,
    shortDescription: "Custom slap image with circular avatars",
    longDescription: "Custom slap image using drive template and circular avatars",
    category: "FUN & GAME",
    guide: "{pn} @tag OR reply"
  },

  langs: {
    en: {
      noTag: "যারে থাপড়াবি ওরে মেনশন দে অথবা রিপ্লাই দে 😒"
    }
  },

  onStart: async function ({ event, message, getLang }) {

    const uid1 = event.senderID;
    let uid2;

    // ✅ Priority 1: Reply
    if (event.type === "message_reply") {
      uid2 = event.messageReply.senderID;
    }

    // ✅ Priority 2: Mention
    else if (Object.keys(event.mentions || {}).length > 0) {
      uid2 = Object.keys(event.mentions)[0];
    }

    if (!uid2)
      return message.reply(getLang("noTag"));

    try {

      // 🖼️ Avatar (Custom Local Path System)
      const avatarPath1 = await getAvatarUrl(uid1).catch(() => null);
      const avatarPath2 = await getAvatarUrl(uid2).catch(() => null);

      if (!avatarPath1 || !avatarPath2)
        return message.reply("❌ Avatar পাওয়া যায়নি।");

      // 🌄 Background from Drive
      const bgURL =
        "https://drive.google.com/uc?export=download&id=1e10wHiZ8KgbYJQutjE-FTAMucQVSKnIH";

      const bgStream = await getStreamFromURL(bgURL);
      const bgBuffer = await streamToBuffer(bgStream);

      const [template, img1, img2] = await Promise.all([
        loadImage(bgBuffer),
        loadImage(avatarPath1),
        loadImage(avatarPath2)
      ]);

      const canvas = createCanvas(template.width, template.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(template, 0, 0);

      // 🔵 Circle Avatar Function
      function drawCircleAvatar(img, x, y, size) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      }

      // 👋 Avatar Position
      drawCircleAvatar(img1, 165, 230, 90);   // Sender
      drawCircleAvatar(img2, 235, 500, 110);  // Target

      // 📂 Temp Folder
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

// 🔧 Stream → Buffer
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", c => chunks.push(c));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}
