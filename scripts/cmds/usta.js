const { getStreamFromURL } = global.utils;
const Jimp = require("jimp");
const { Readable } = require("stream");

module.exports = {
  config: {
    name: "usta",
    version: "3.0",
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

      if (event.type === "message_reply") {
        targetID = event.messageReply.senderID;
      }
      else if (event.mentions && Object.keys(event.mentions).length > 0) {
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

      let name1 = await usersData.getName(senderID).catch(() => senderInfo?.name || "User1");
      let name2 = await usersData.getName(targetID).catch(() => targetInfo?.name || "User2");

      let avatarUrl1 = await usersData.getAvatarUrl(senderID).catch(() => null);
      let avatarUrl2 = await usersData.getAvatarUrl(targetID).catch(() => null);

      // Message text (only body, not on image)
      const msg = `${name1} + ${name2}\nউষ্টা খাইয়া দূরে গিয়া মর 🤣🔥`;

      // -------------------------
      // IMAGE BUILDING
      // -------------------------

      const streamToBuffer = (stream) =>
        new Promise((resolve, reject) => {
          const chunks = [];
          stream.on("data", c => chunks.push(c));
          stream.on("end", () => resolve(Buffer.concat(chunks)));
          stream.on("error", reject);
        });

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

      if (!bgBuffer) return message.reply("❌ Background PNG লোড করা যায়নি।");

      const bg = await Jimp.read(bgBuffer);

      // Avatar loader
      async function loadAvatar(url, fallbackName) {
        if (!url) return placeholder(fallbackName);

        try {
          const s = await getStreamFromURL(url);
          const buf = await streamToBuffer(s);
          return await Jimp.read(buf);
        } catch {
          return placeholder(fallbackName);
        }
      }

      function placeholder(name) {
        const img = new Jimp(100, 100, "#777");
        const initials = (String(name)[0] || "U").toUpperCase();

        return Jimp.loadFont(Jimp.FONT_SANS_32_WHITE).then(font => {
          img.print(font, 0, 0, {
            text: initials,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
          }, 100, 100);

          return img;
        });
      }

      let img1 = await loadAvatar(avatarUrl1, name1);
      let img2 = await loadAvatar(avatarUrl2, name2);

      if (img1 instanceof Promise) img1 = await img1;
      if (img2 instanceof Promise) img2 = await img2;

      img1 = img1.resize(150, 150).circle();
      img2 = img2.resize(150, 150).circle();

      // Place avatars ONLY (no text)
      bg.composite(img1, 900, 160);
      bg.composite(img2, 400, 130);

      const outBuffer = await bg.getBufferAsync(Jimp.MIME_PNG);

      const imgStream = Readable.from(outBuffer);
      imgStream.path = "usta.png";

      return message.reply({
        body: msg,
        attachment: imgStream
      });

    } catch (err) {
      console.error(err);
      return message.reply("❌ Usta command failed.");
    }
  }
};
