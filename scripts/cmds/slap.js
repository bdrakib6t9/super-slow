const Jimp = require("jimp");
const fs = require("fs-extra");
const path = require("path");
const { getStreamFromURL } = global.utils;
const { getAvatarUrl } = require("../../rakib/customApi/getAvatarUrl");

module.exports = {
  config: {
    name: "slap",
    version: "2.2",
    author: "Rakib",
    countDown: 5,
    role: 0,
    shortDescription: "Slap image",
    longDescription: "Slap image (mention or reply)",
    category: "image",
    guide: {
      en: "{pn} @tag | reply + {pn}"
    }
  },

  langs: {
    vi: {
      noTag: "Bạn phải tag hoặc reply người bạn muốn tát"
    },
    en: {
      noTag: "You must tag or reply to the person you want to slap"
    }
  },

  onStart: async function ({ event, message, args, getLang }) {
    try {
      const uid1 = event.senderID;

      // ✅ target user (mention OR reply)
      let uid2 = Object.keys(event.mentions || {})[0];
      if (!uid2 && event.messageReply?.senderID) {
        uid2 = event.messageReply.senderID;
      }

      // ❌ no target
      if (!uid2) {
        return message.reply(getLang("noTag"));
      }

      // -------------------------
      // AVATAR PATHS (LOCAL CACHE)
      // -------------------------
      const avatarPath1 = await getAvatarUrl(uid1).catch(() => null);
      const avatarPath2 = await getAvatarUrl(uid2).catch(() => null);

      // -------------------------
      // BACKGROUND
      // -------------------------
      const bgUrl = "https://i.postimg.cc/QCtBbqWH/slap.jpg";
      const bgStream = await getStreamFromURL(bgUrl);

      const streamToBuffer = (stream) =>
        new Promise((resolve, reject) => {
          const chunks = [];
          stream.on("data", c => chunks.push(c));
          stream.on("end", () => resolve(Buffer.concat(chunks)));
          stream.on("error", reject);
        });

      const bgBuffer = await streamToBuffer(bgStream);
      const bg = await Jimp.read(bgBuffer);

      // -------------------------
      // AVATAR LOADER (PATH BASED)
      // -------------------------
      async function loadAvatar(localPath) {
        try {
          if (localPath && fs.existsSync(localPath)) {
            return await Jimp.read(localPath);
          }
        } catch {}

        return new Jimp(120, 120, "#999999");
      }

      let img1 = await loadAvatar(avatarPath1); // slapper
      let img2 = await loadAvatar(avatarPath2); // victim

      // resize + circle
      img1.resize(120, 120).circle();
      img2.resize(120, 120).circle();

      /**
       * slap meme position
       * left = victim
       * right = slapper
       */
      bg.composite(img2, 120, 200); // victim
      bg.composite(img1, 420, 80);  // slapper

      // -------------------------
      // TEMP FILE
      // -------------------------
      const dir = path.join(__dirname, "tmp");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);

      const filePath = path.join(dir, `${uid1}_${uid2}_slap.jpg`);
      await bg.writeAsync(filePath);

      const content = args.join(" ").trim();

      return message.reply(
        {
          body: content || "Bópppp 😵‍💫😵",
          attachment: fs.createReadStream(filePath)
        },
        () => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      );

    } catch (err) {
      console.error("slap command error:", err);
      return message.reply("❌ Slap command failed.");
    }
  }
};
