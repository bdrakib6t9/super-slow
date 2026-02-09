const { getStreamFromURL } = global.utils;
const Jimp = require("jimp");
const { Readable } = require("stream");
const fs = require("fs");
const { getAvatarUrl } = require("../../rakib/customApi/getAvatarUrl");

module.exports = {
  config: {
    name: "sis",
    version: "1.2",
    author: "Rakib + hoon",
    category: "fun",
    guide: "{prefix}sis [@mention/reply]"
  },

  onStart: async function ({ event, threadsData, message, usersData }) {
    try {
      const uidI = event.senderID;

      const threadData = await threadsData.get(event.threadID);
      if (!threadData) return message.reply("❌ Thread data not available.");

      const members = threadData.members || [];
      const senderInfo = members.find(m => String(m.userID) === String(uidI));
      if (!senderInfo) {
        return message.reply("❌ Could not find your info in this group.");
      }

      const getMember = (id) =>
        members.find(m => String(m.userID) === String(id));

      /* ================= SENDER ================= */
      let name1 = await usersData.getName(uidI).catch(() => null);
      if (!name1) {
        name1 = senderInfo?.name || senderInfo?.fullName || "Unknown User";
      }

      const avatarPath1 = await getAvatarUrl(uidI).catch(() => null);

      /* ================= TARGET (reply / mention / random) ================= */
      let targetId = null;

      if (event.type === "message_reply" && event.messageReply?.senderID) {
        targetId = String(event.messageReply.senderID);
      }

      if (!targetId && event.mentions && Object.keys(event.mentions).length > 0) {
        targetId = String(Object.keys(event.mentions)[0]);
      }

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
      if (!name2) {
        name2 = matchedInfo?.name || matchedInfo?.fullName || "Unknown User";
      }

      const avatarPath2 = await getAvatarUrl(matchedId).catch(() => null);

      /* ================= TEXT ================= */
      const msg =
`💗✨ ভাই–বোনের বন্ধন ✨💗

🤝 ${name1}
🤝 ${name2}

"আমাদের ভাই–বোনের বন্ধন,  
অটুট থাকবে আজীবন। 💞"`;

      /* ================= BACKGROUND ================= */
      const bgUrls = [
        "https://raw.githubusercontent.com/bdrakib12/baby-goat-bot/main/scripts/cmds/cache/sis.png",
        "https://i.postimg.cc/G3KCt4ZQ/sis.jpg"
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
        } catch {}
      }

      if (!bgImage) {
        return message.reply(msg);
      }

      const bg = bgImage;

      /* ================= POSITIONS ================= */
      const size1 = 191; // sender
      const size2 = 190; // target
      const pos1 = { x: 93, y: 111 };
      const pos2 = { x: 434, y: 107 };

      /* ================= AVATAR LOADER ================= */
      async function loadAvatar(localPath, fallbackName) {
        try {
          if (localPath && fs.existsSync(localPath)) {
            return await Jimp.read(localPath);
          }
        } catch {}

        return createPlaceholder(fallbackName);
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

      /* ================= LOAD AVATARS ================= */
      let img1 = await loadAvatar(avatarPath1, name1);
      let img2 = await loadAvatar(avatarPath2, name2);

      img1 = img1.resize(size1, size1).circle();
      img2 = img2.resize(size2, size2).circle();

      bg.composite(img1, pos1.x, pos1.y);
      bg.composite(img2, pos2.x, pos2.y);

      /* ================= OUTPUT ================= */
      const finalBuffer = await bg.getBufferAsync(Jimp.MIME_PNG);
      const imgStream = Readable.from(finalBuffer);
      imgStream.path = "sis.png";

      return message.reply({
        body: msg,
        attachment: imgStream
      });

    } catch (err) {
      console.error("sis command error:", err);
      return message.reply("❌ An unexpected error occurred. Please try again later.");
    }
  }
};
