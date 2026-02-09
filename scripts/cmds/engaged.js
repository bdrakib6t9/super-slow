const fs = require("fs");
const { getStreamFromURL } = global.utils;
const { getAvatarUrl } = require("../../rakib/customApi/getAvatarUrl");
const Jimp = require("jimp");
const { Readable } = require("stream");

module.exports = {
  config: {
    name: "engaged",
    aliases: ["eng"],
    version: "2.3",
    author: "Rakib",
    category: "love",
    guide: "{prefix}engaged (or {prefix}eng) — reply or mention someone"
  },

  onStart: async function ({ event, threadsData, message, usersData }) {
    try {
      const senderID = event.senderID;

      // -------------------------
      // TARGET SYSTEM (reply > mention > random)
      // -------------------------
      let targetID = null;

      if (event.type === "message_reply" && event.messageReply?.senderID) {
        targetID = event.messageReply.senderID;
      } else if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      }

      const threadData = await threadsData.get(event.threadID);
      const members = threadData?.members || [];

      if (!targetID) {
        const others = members.filter(
          m => m.inGroup && String(m.userID) !== String(senderID)
        );
        if (!others.length) {
          return message.reply("❌ No one available to pair.");
        }
        targetID = others[Math.floor(Math.random() * others.length)].userID;
      }

      const senderInfo = members.find(m => String(m.userID) === String(senderID));
      const targetInfo = members.find(m => String(m.userID) === String(targetID));

      if (!senderInfo || !targetInfo) {
        return message.reply("❌ Could not get user info.");
      }

      const name1 = await usersData
        .getName(senderID)
        .catch(() => senderInfo?.name || "User1");

      const name2 = await usersData
        .getName(targetID)
        .catch(() => targetInfo?.name || "User2");

      // 🔥 local avatar paths
      const avatarPath1 = await getAvatarUrl(senderID).catch(() => null);
      const avatarPath2 = await getAvatarUrl(targetID).catch(() => null);

      // -------------------------
      // MESSAGE BODY (TEXT ONLY)
      // -------------------------
      const topText = `𝗙𝗿𝗼𝗺 𝘁𝗼𝗱𝗮𝘆, 𝘄𝗲 𝗯𝗲𝗹𝗼𝗻𝗴 𝘁𝗼 𝗲𝗮𝗰𝗵 𝗼𝘁𝗵𝗲𝗿 𝗳𝗼𝗿𝗲𝘃𝗲𝗿 —`;
      const midText = `𝗼𝘂𝗿 𝗹𝗼𝘃𝗲 𝗶𝘀 𝘀𝗲𝗮𝗹𝗲𝗱 𝘄𝗶𝘁𝗵 𝗮 𝗯𝗲𝗮𝘂𝘁𝗶𝗳𝘂𝗹 𝗽𝗿𝗼𝗺𝗶𝘀𝗲 💍✨`;
      const bottomText = `𝗛𝗲𝗿𝗲 𝗯𝗲𝗴𝗶𝗻𝘀 𝗼𝘂𝗿 𝗻𝗲𝘄 𝗷𝗼𝘂𝗿𝗻𝗲𝘆 𝘁𝗼𝗴𝗲𝘁𝗵𝗲𝗿 ❤️`;

      const messageBody =
        `${name1} ❤ ${name2}\n\n` +
        `${topText}\n${midText}\n${bottomText}`;

      // -------------------------
      // HELPERS
      // -------------------------
      const streamToBuffer = (stream) =>
        new Promise((resolve, reject) => {
          const chunks = [];
          stream.on("data", c => chunks.push(c));
          stream.on("end", () => resolve(Buffer.concat(chunks)));
          stream.on("error", reject);
        });

      function placeholder(name, size) {
        const img = new Jimp(size, size, "#888");
        const initials = String(name || "U")[0]?.toUpperCase() || "U";
        return Jimp.loadFont(Jimp.FONT_SANS_64_WHITE).then(font => {
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

      async function loadAvatar(localPath, fallbackName, size) {
        try {
          if (localPath && fs.existsSync(localPath)) {
            return await Jimp.read(localPath);
          }
        } catch {}
        return placeholder(fallbackName, size);
      }

      // -------------------------
      // BACKGROUND
      // -------------------------
      const bgUrls = [
        "https://raw.githubusercontent.com/bdrakib12/baby-goat-bot/main/scripts/cmds/cache/engaged.jpg",
        "https://i.postimg.cc/VvdyfYNZ/engaged.jpg"
      ];

      let bgBuffer = null;
      for (const url of bgUrls) {
        try {
          const s = await getStreamFromURL(url);
          bgBuffer = await streamToBuffer(s);
          if (bgBuffer?.length) break;
        } catch {}
      }

      if (!bgBuffer) {
        return message.reply("❌ Failed to load engaged background.");
      }

      const bg = await Jimp.read(bgBuffer);

      // -------------------------
      // AVATAR COMPOSITE
      // -------------------------
      const AVATAR_SIZE = 100;
      const pos1 = { x: 550, y: 260 }; // sender
      const pos2 = { x: 100, y: 70 };  // target

      let img1 = await loadAvatar(avatarPath1, name1, AVATAR_SIZE);
      let img2 = await loadAvatar(avatarPath2, name2, AVATAR_SIZE);

      img1 = img1.resize(AVATAR_SIZE, AVATAR_SIZE).circle();
      img2 = img2.resize(AVATAR_SIZE, AVATAR_SIZE).circle();

      bg.composite(img1, pos1.x, pos1.y);
      bg.composite(img2, pos2.x, pos2.y);

      // -------------------------
      // EXPORT
      // -------------------------
      const outBuf = await bg.getBufferAsync(Jimp.MIME_JPEG);
      const imgStream = Readable.from(outBuf);
      imgStream.path = "engaged.jpg";

      return message.reply({
        body: messageBody,
        attachment: imgStream
      });

    } catch (err) {
      console.error("engaged command error:", err);
      return message.reply("❌ Engaged command failed.");
    }
  }
};
