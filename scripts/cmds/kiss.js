const { getStreamFromURL } = global.utils;
const Jimp = require("jimp");
const { Readable } = require("stream");

module.exports = {
  config: {
    name: "kiss",
    version: "1.0",
    author: "Rakib",
    category: "love",
    guide: "{prefix}kiss @mention বা কাউকে reply দিন"
  },

  onStart: async function ({ event, threadsData, message, usersData }) {
    try {
      const senderID = event.senderID;

      // -------------------------
      // TARGET (reply > mention)
      // -------------------------
      let targetID = null;
      if (event.type === "message_reply") {
        targetID = event.messageReply.senderID;
      } else if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      }

      if (!targetID) {
        return message.reply("❌ কাউকে reply বা mention করলে তবেই kiss কাজ করবে 😘");
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

      // 💬 Message body text (random cute)
      const texts = [
        "💋 A sweet kiss just landed!",
        "😘 Love is in the air!",
        "💞 That was a gentle kiss!",
        "💖 Kiss delivered with care!",
        "😚 A warm kiss for you!"
      ];
      const bodyText = texts[Math.floor(Math.random() * texts.length)];

      // -------------------------
      // IMAGE PART
      // -------------------------
      const streamToBuffer = (stream) =>
        new Promise((resolve, reject) => {
          const chunks = [];
          stream.on("data", c => chunks.push(c));
          stream.on("end", () => resolve(Buffer.concat(chunks)));
          stream.on("error", reject);
        });

      // Background image
      const bgUrls = [
        "https://raw.githubusercontent.com/bdrakib12/baby-goat-bot/main/scripts/cmds/cache/hon0.jpeg",
        "https://i.postimg.cc/jS0DDQL0/hon0.jpg"
      ];

      let bgBuffer = null;
      for (const url of bgUrls) {
        try {
          const s = await getStreamFromURL(url);
          bgBuffer = await streamToBuffer(s);
          break;
        } catch {}
      }

      if (!bgBuffer) return message.reply("❌ kiss background লোড করা যায়নি।");

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
        const img = new Jimp(150, 150, "#888");
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

      let img1 = await loadAvatar(avatarUrl1, name1);
      let img2 = await loadAvatar(avatarUrl2, name2);

      if (img1 instanceof Promise) img1 = await img1;
      if (img2 instanceof Promise) img2 = await img2;

      // resize + circle
      img1 = img1.resize(150, 150).circle();
      img2 = img2.resize(150, 150).circle();

      // EXACT composite positions (as you requested)
      bg.composite(img1, 420, 40);
      bg.composite(img2, 100, 160);

      // Export image
      const outBuffer = await bg.getBufferAsync(Jimp.MIME_JPEG);
      const imgStream = Readable.from(outBuffer);
      imgStream.path = "kiss.jpg";

      return message.reply({
        body: `💋 ${name1} ➜ ${name2}\n${bodyText}`,
        attachment: imgStream
      });

    } catch (err) {
      console.error(err);
      return message.reply("❌ Kiss command failed.");
    }
  }
};
