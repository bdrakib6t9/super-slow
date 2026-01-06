const { getStreamFromURL } = global.utils;
const Jimp = require("jimp");
const { Readable } = require("stream");

module.exports = {
  config: {
    name: "bestu",
    version: "1.0",
    author: "Rakib + hoon",
    category: "fun",
    guide: "{prefix}bestu [@mention/reply]"
  },

  onStart: async function ({ event, threadsData, message, usersData }) {
    try {
      const uidI = event.senderID;

      const threadData = await threadsData.get(event.threadID);
      if (!threadData) return message.reply("❌ Thread data not available.");

      const members = threadData.members || [];
      const senderInfo = members.find(m => String(m.userID) === String(uidI));
      if (!senderInfo) return message.reply("❌ Could not find your info in this group.");

      const getMember = (id) =>
        members.find(m => String(m.userID) === String(id));

      // sender info
      let name1 = await usersData.getName(uidI).catch(() => null);
      if (!name1) name1 = senderInfo?.name || senderInfo?.fullName || "Unknown User";

      let avatarUrl1 = await usersData.getAvatarUrl(uidI).catch(() => null);

      // ---------- target নির্বাচন (reply / mention / random) ----------
      let targetId = null;

      if (event.type === "message_reply" && event.messageReply?.senderID)
        targetId = String(event.messageReply.senderID);

      if (!targetId && event.mentions && Object.keys(event.mentions).length > 0)
        targetId = String(Object.keys(event.mentions)[0]);

      let matchedInfo = null;

      if (targetId && targetId !== String(uidI)) {
        matchedInfo = getMember(targetId);
      }

      if (!matchedInfo) {
        const list = members.filter(
          m => m.inGroup && String(m.userID) !== String(uidI)
        );
        if (!list.length) return message.reply("❌ Could not find someone.");
        matchedInfo = list[Math.floor(Math.random() * list.length)];
      }

      const matchedId = matchedInfo.userID;

      let name2 = await usersData.getName(matchedId).catch(() => null);
      if (!name2) name2 = matchedInfo?.name || matchedInfo?.fullName || "Unknown User";

      let avatarUrl2 = await usersData.getAvatarUrl(matchedId).catch(() => null);

      // 💛 বেস্টুকে নিয়ে সুন্দর ছন্দ 💛
      const msg =
`💛✨ বেস্টু forever ✨💛

🤝 ${name1}
🤝 ${name2}

"বেস্টু মানে পাগলামি আর টোকা,  
হাজার দূরেও বন্ধন থাকে অটুট रखा। 💛"`;

      // ---------- Background with fallback (bestu.png / bestu.jpg) ----------
      const bgUrls = [
        "https://raw.githubusercontent.com/bdrakib12/baby-goat-bot/main/scripts/cmds/cache/bestu.png",
        "https://i.postimg.cc/1XGbq3RG/bestu.jpg"
      ];

      const streamToBuffer = (stream) =>
        new Promise((resolve, reject) => {
          const chunks = [];
          stream.on("data", c => chunks.push(c));
          stream.on("end", () => resolve(Buffer.concat(chunks)));
          stream.on("error", reject);
        });

      let bgImage = null;

      for (const url of bgUrls) {
        try {
          const s = await getStreamFromURL(url);
          const b = await streamToBuffer(s);
          bgImage = await Jimp.read(b);
          break;
        } catch (e) {
          console.warn("Failed to load bestu background from", url, e);
        }
      }

      if (!bgImage) return message.reply(msg);

      const bg = bgImage;

      // ✅ crush/sis/bro-এর মতোই ratio:
      // composite(_0x4f340a.resize(191, 191), 93, 111)
      // composite(_0x1b6c51.resize(190, 190), 434, 107);
      const size1 = 191;
      const size2 = 190;
      const pos1 = { x: 93, y: 111 };   // sender
      const pos2 = { x: 434, y: 107 };  // bestu

      async function loadAvatar(url, fallbackName) {
        if (!url) return createPlaceholder(fallbackName);
        try {
          const s = await getStreamFromURL(url);
          const b = await streamToBuffer(s);
          return await Jimp.read(b);
        } catch (e) {
          console.warn("Failed to load avatar:", url, e);
          return createPlaceholder(fallbackName);
        }
      }

      function createPlaceholder(name) {
        const size = 200;
        const img = new Jimp(size, size, "#f0f0ff");
        const initials = String(name || "U")
          .split(" ")
          .map(w => w[0])
          .filter(Boolean)
          .slice(0, 2)
          .join("")
          .toUpperCase();

        return Jimp.loadFont(Jimp.FONT_SANS_32_BLACK).then(font => {
          img.print(
            font,
            0,
            0,
            {
              text: initials,
              alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
              alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
            },
            size,
            size
          );
          return img;
        });
      }

      let img1 = await loadAvatar(avatarUrl1, name1);
      let img2 = await loadAvatar(avatarUrl2, name2);

      if (img1 instanceof Promise) img1 = await img1;
      if (img2 instanceof Promise) img2 = await img2;

      img1 = img1.resize(size1, size1).circle();
      img2 = img2.resize(size2, size2).circle();

      bg.composite(img1, pos1.x, pos1.y);
      bg.composite(img2, pos2.x, pos2.y);

      const finalBuffer = await bg.getBufferAsync(Jimp.MIME_PNG);
      const imgStream = Readable.from(finalBuffer);
      imgStream.path = "bestu.png";

      return message.reply({
        body: msg,
        attachment: imgStream
      });

    } catch (err) {
      console.error("bestu command error:", err);
      return message.reply("❌ An unexpected error occurred. Please try again later.");
    }
  }
};
