const { getStreamFromURL } = global.utils;
const Jimp = require("jimp");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "slap",
    version: "2.0",
    author: "NTKhang + Rakib",
    countDown: 5,
    role: 0,
    shortDescription: "Slap image",
    longDescription: "Slap image (custom background)",
    category: "image",
    guide: {
      en: "{pn} @tag"
    }
  },

  langs: {
    vi: {
      noTag: "Bạn phải tag người bạn muốn tát"
    },
    en: {
      noTag: "You must tag the person you want to slap"
    }
  },

  onStart: async function ({ event, message, usersData, args, getLang }) {
    try {
      const uid1 = event.senderID;
      const uid2 = Object.keys(event.mentions || {})[0];

      // ❌ no mention
      if (!uid2)
        return message.reply(getLang("noTag"));

      // 🚫 restricted ID
      if (uid2 === "100078140834638") {
        return message.reply("Slap yourself Dude 🐸🐸!");
      }

      // avatars
      const avatarURL1 = await usersData.getAvatarUrl(uid1).catch(() => null);
      const avatarURL2 = await usersData.getAvatarUrl(uid2).catch(() => null);

      // helper stream → buffer
      const streamToBuffer = (stream) =>
        new Promise((resolve, reject) => {
          const chunks = [];
          stream.on("data", c => chunks.push(c));
          stream.on("end", () => resolve(Buffer.concat(chunks)));
          stream.on("error", reject);
        });

      // background
      const bgUrl = "https://i.postimg.cc/QCtBbqWH/slap.jpg";
      const bgStream = await getStreamFromURL(bgUrl);
      const bgBuffer = await streamToBuffer(bgStream);
      const bg = await Jimp.read(bgBuffer);

      // avatar loader
      async function loadAvatar(url) {
        if (!url) return new Jimp(120, 120, "#999");
        try {
          const s = await getStreamFromURL(url);
          const b = await streamToBuffer(s);
          return await Jimp.read(b);
        } catch {
          return new Jimp(120, 120, "#999");
        }
      }

      let img1 = await loadAvatar(avatarURL1);
      let img2 = await loadAvatar(avatarURL2);

      // resize + circle
      img1 = img1.resize(120, 120).circle();
      img2 = img2.resize(120, 120).circle();

      /**
       * 🧠 POSITION (adjust if needed)
       * slap meme style:
       * left = victim
       * right = slapper
       */
      bg.composite(img2, 120, 200); // victim
      bg.composite(img1, 420, 80);  // slapper

      // save temp
      const dir = path.join(__dirname, "tmp");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);

      const filePath = path.join(dir, `${uid1}_${uid2}_slap.jpg`);
      await bg.writeAsync(filePath);

      const content = args.join(" ").replace(uid2, "").trim();

      return message.reply({
        body: content || "Bópppp 😵‍💫😵",
        attachment: fs.createReadStream(filePath)
      }, () => fs.unlinkSync(filePath));

    } catch (err) {
      console.error(err);
      return message.reply("❌ Slap command failed.");
    }
  }
};
