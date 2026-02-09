const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");
const { getAvatarUrl } = require("../../rakib/customApi/getAvatarUrl");

module.exports = {
  config: {
    name: "bonk",
    aliases: ["bonki"],
    author: "Rakib",
    shortDescription: "Bonk someone",
    longDescription: "Make a BONK meme using two avatars",
    category: "fun",
  },

  // ---------------- CIRCLE CROP ----------------
  circleCrop: async function (imagePath, size) {
    const img = await loadImage(imagePath);
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(img, 0, 0, size, size);
    return canvas;
  },

  // ---------------- IMAGE BUILD ----------------
  makeImage: async function (one, two) {
    const bgURL = "https://i.postimg.cc/KYJ0VnK0/image0.png";
    const bg = await loadImage(bgURL);

    const width = 640;
    const height = 480;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(bg, 0, 0, width, height);

    // -------- avatars (LOCAL CACHE) --------
    const avatarPath1 = await getAvatarUrl(one).catch(() => null);
    const avatarPath2 = await getAvatarUrl(two).catch(() => null);

    const fallback = path.join(__dirname, "default_avatar.png");

    const pfp1 = avatarPath1 && fs.existsSync(avatarPath1)
      ? avatarPath1
      : fallback;

    const pfp2 = avatarPath2 && fs.existsSync(avatarPath2)
      ? avatarPath2
      : fallback;

    const circle1 = await this.circleCrop(pfp1, 110); // hitter
    const circle2 = await this.circleCrop(pfp2, 90);  // victim

    // swap positions (same as original)
    ctx.drawImage(circle1, 60, 150);
    ctx.drawImage(circle2, 500, 220);

    const outPath = path.join(__dirname, `bonk_${one}_${two}.png`);
    fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
    return outPath;
  },

  // ---------------- COMMAND ----------------
  onStart: async function ({ api, event, args }) {
    try {
      const { threadID, messageID, senderID, mentions, messageReply } = event;

      let targetID;
      if (messageReply?.senderID) targetID = messageReply.senderID;
      else if (Object.keys(mentions || {}).length) targetID = Object.keys(mentions)[0];
      else if (args[0] && /^\d+$/.test(args[0])) targetID = args[0];
      else {
        return api.sendMessage(
          "⚠ Reply / Mention / UID use koro.",
          threadID,
          messageID
        );
      }

      const one = senderID;
      const two = targetID;

      // -------- target name --------
      let targetName = "User";
      try {
        const info = await api.getUserInfo(targetID);
        if (info?.[targetID]?.name) {
          targetName = info[targetID].name;
        }
      } catch {
        if (mentions?.[targetID]) {
          targetName = mentions[targetID].replace("@", "");
        }
      }

      const file = await this.makeImage(one, two);

      api.sendMessage(
        {
          body: `${targetName} bonk nigga 🪓`,
          attachment: fs.createReadStream(file),
        },
        threadID,
        () => {
          if (fs.existsSync(file)) fs.unlinkSync(file);
        },
        messageID
      );

    } catch (err) {
      api.sendMessage(
        "❌ Error: " + err.message,
        event.threadID,
        event.messageID
      );
    }
  },
};
