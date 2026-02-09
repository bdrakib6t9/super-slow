const fs = require("fs");
const Jimp = require("jimp");
const { Readable } = require("stream");
const { getStreamFromURL } = global.utils;
const { getAvatarUrl } = require("../../rakib/customApi/getAvatarUrl");

module.exports = {
  config: {
    name: "usta",
    version: "3.1",
    author: "Rakib",
    category: "fun",
    guide: "{prefix}usta @mention বা কাউকে reply দিন"
  },

  onStart: async function ({ event, threadsData, message, usersData }) {
    try {
      const senderID = event.senderID;

      // -------------------------
      // TARGET SYSTEM
      // -------------------------
      let targetID = null;

      if (event.type === "message_reply" && event.messageReply?.senderID) {
        targetID = event.messageReply.senderID;
      } else if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      }

      if (!targetID) {
        return message.reply("❌ কাউকে রিপ্লাই বা মেনশন দিন ব্যবহারের জন্য।");
      }

      // -------------------------
      // USER DATA
      // -------------------------
      const threadData = await threadsData.get(event.threadID);
      const members = threadData?.members || [];

      const senderInfo = members.find(m => String(m.userID) === String(senderID));
      const targetInfo = members.find(m => String(m.userID) === String(targetID));

      const name1 = await usersData.getName(senderID).catch(() => senderInfo?.name || "User1");
      const name2 = await usersData.getName(targetID).catch(() => targetInfo?.name || "User2");

      // -------------------------
      // AVATAR PATH (LOCAL CACHE)
      // -------------------------
      const avatarPath1 = await getAvatarUrl(senderID).catch(() => null);
      const avatarPath2 = await getAvatarUrl(targetID).catch(() => null);

      // Message text (only body)
      const msg = `${name1} + ${name2}\nউষ্টা খাইয়া দূরে গিয়া মর 🤣🔥`;

      // -------------------------
      // IMAGE HELPERS
      // -------------------------
      const streamToBuffer = (stream) =>
        new Promise((resolve, reject) => {
          const chunks = [];
          stream.on("data", c => chunks.push(c));
          stream.on("end", () => resolve(Buffer.concat(chunks)));
          stream.on("error", reject);
        });

      function placeholder(name) {
        const img = new Jimp(150, 150, "#777");
        const letter = (String(name)[0] || "U").toUpperCase();

        return Jimp.loadFont(Jimp.FONT_SANS_64_WHITE).then(font => {
          img.print(
            font,
            0,
            0,
            {
              text: letter,
              alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
              alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
            },
            150,
            150
          );
          return img;
        });
      }

      async function loadAvatar(path, fallbackName) {
        try {
          if (!path || !fs.existsSync(path)) {
            return await placeholder(fallbackName);
          }
          return await Jimp.read(path);
        } catch {
          return await placeholder(fallbackName);
        }
      }

      // -------------------------
      // LOAD BACKGROUND
      // -------------------------
      const bgUrls = [
        "https://raw.githubusercontent.com/bdrakib12/baby-goat-bot/main/scripts/cmds/cache/usta.png",
        "https://i.postimg.cc/XqzNssHJ/usta.png"
      ];

      let bgBuffer = null;
      for (const url of bgUrls) {
        try {
          const s = await getStreamFromURL(url);
          bgBuffer = await streamToBuffer(s);
          break;
        } catch {}
      }

      if (!bgBuffer) {
        return message.reply("❌ Background PNG লোড করা যায়নি।");
      }

      const bg = await Jimp.read(bgBuffer);

      // -------------------------
      // LOAD AVATARS
      // -------------------------
      let img1 = await loadAvatar(avatarPath1, name1);
      let img2 = await loadAvatar(avatarPath2, name2);

      img1 = img1.resize(150, 150).circle();
      img2 = img2.resize(150, 150).circle();

      // Place avatars
      bg.composite(img1, 900, 160);
      bg.composite(img2, 400, 130);

      // -------------------------
      // FINAL OUTPUT
      // -------------------------
      const outBuffer = await bg.getBufferAsync(Jimp.MIME_PNG);
      const imgStream = Readable.from(outBuffer);
      imgStream.path = "usta.png";

      return message.reply({
        body: msg,
        attachment: imgStream
      });

    } catch (err) {
      console.error("usta command error:", err);
      return message.reply("❌ Usta command failed.");
    }
  }
};
