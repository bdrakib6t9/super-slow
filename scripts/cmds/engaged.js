const { getStreamFromURL } = global.utils;
const Jimp = require("jimp");
const { Readable } = require("stream");

module.exports = {
  config: {
    name: "engaged",
    aliases: ["eng"],
    version: "2.2",
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

      if (event.type === "message_reply" && event.messageReply) {
        targetID = event.messageReply.senderID;
      } else if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      }

      const threadData = await threadsData.get(event.threadID);
      const members = threadData?.members || [];

      if (!targetID) {
        // fallback random other member
        const others = members.filter(m => String(m.userID) !== String(senderID) && m.inGroup);
        if (!others.length) return message.reply("❌ No one available to pair.");
        targetID = others[Math.floor(Math.random() * others.length)].userID;
      }

      const senderInfo = members.find(m => String(m.userID) === String(senderID));
      const targetInfo = members.find(m => String(m.userID) === String(targetID));

      if (!senderInfo || !targetInfo) {
        return message.reply("❌ Could not get user info.");
      }

      let name1 = await usersData.getName(senderID).catch(() => senderInfo?.name || "User1");
      let name2 = await usersData.getName(targetID).catch(() => targetInfo?.name || "User2");

      let avatarUrl1 = await usersData.getAvatarUrl(senderID).catch(() => null);
      let avatarUrl2 = await usersData.getAvatarUrl(targetID).catch(() => null);

      // Final Text (Bold) — will be only in message body, NOT printed on image
      const topText = `𝗙𝗿𝗼𝗺 𝘁𝗼𝗱𝗮𝘆, 𝘄𝗲 𝗯𝗲𝗹𝗼𝗻𝗴 𝘁𝗼 𝗲𝗮𝗰𝗵 𝗼𝘁𝗵𝗲𝗿 𝗳𝗼𝗿𝗲𝘃𝗲𝗿 —`;
      const midText = `𝗼𝘂𝗿 𝗹𝗼𝘃𝗲 𝗶𝘀 𝘀𝗲𝗮𝗹𝗲𝗱 𝘄𝗶𝘁𝗵 𝗮 𝗯𝗲𝗮𝘂𝘁𝗶𝗳𝘂𝗹 𝗽𝗿𝗼𝗺𝗶𝘀𝗲 💍✨`;
      const bottomText = `𝗛𝗲𝗿𝗲 𝗯𝗲𝗴𝗶𝗻𝘀 𝗼𝘂𝗿 𝗻𝗲𝘄 𝗷𝗼𝘂𝗿𝗻𝗲𝘆 𝘁𝗼𝗴𝗲𝘁𝗵𝗲𝗿 ❤️`;

      // message body (combine)
      const messageBody = `${name1} ❤ ${name2}\n\n${topText}\n${midText}\n${bottomText}`;

      // helper stream→buffer
      const streamToBuffer = (stream) =>
        new Promise((resolve, reject) => {
          const chunks = [];
          stream.on("data", c => chunks.push(c));
          stream.on("end", () => resolve(Buffer.concat(chunks)));
          stream.on("error", reject);
        });

      // background
      const bgUrls = [
        "https://raw.githubusercontent.com/bdrakib12/baby-goat-bot/main/scripts/cmds/cache/engaged.jpg",
        "https://i.postimg.cc/VvdyfYNZ/engaged.jpg"
      ];

      let bgBuffer = null;
      for (const url of bgUrls) {
        try {
          const s = await getStreamFromURL(url);
          bgBuffer = await streamToBuffer(s);
          if (bgBuffer && bgBuffer.length) break;
        } catch (e) {
          // try next
        }
      }

      if (!bgBuffer) return message.reply("❌ Failed to load engaged background.");

      const bg = await Jimp.read(bgBuffer);
      // const W = bg.bitmap.width;
      // const H = bg.bitmap.height;

      // avatar positions & size (as requested)
      const AVATAR_SIZE = 100;
      const pos1 = { x: 550, y: 260 }; // first image
      const pos2 = { x: 100, y: 70 }; // second image

      async function loadAvatar(url, fallbackName) {
        if (!url) return placeholder(fallbackName);
        try {
          const s = await getStreamFromURL(url);
          const b = await streamToBuffer(s);
          return await Jimp.read(b);
        } catch {
          return placeholder(fallbackName);
        }
      }

      function placeholder(name) {
        const img = new Jimp(AVATAR_SIZE, AVATAR_SIZE, "#888");
        const initials = String(name || "U")[0]?.toUpperCase() || "U";
        return Jimp.loadFont(Jimp.FONT_SANS_64_WHITE).then(font => {
          img.print(font, 0, 0, {
            text: initials,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
          }, AVATAR_SIZE, AVATAR_SIZE);
          return img;
        });
      }

      let img1 = await loadAvatar(avatarUrl1, name1);
      let img2 = await loadAvatar(avatarUrl2, name2);

      if (img1 instanceof Promise) img1 = await img1;
      if (img2 instanceof Promise) img2 = await img2;

      img1 = img1.resize(AVATAR_SIZE, AVATAR_SIZE).circle();
      img2 = img2.resize(AVATAR_SIZE, AVATAR_SIZE).circle();

      // composite avatars only — NO text on image
      bg.composite(img1, pos1.x, pos1.y);
      bg.composite(img2, pos2.x, pos2.y);

      const outBuf = await bg.getBufferAsync(Jimp.MIME_JPEG);
      const imgStream = Readable.from(outBuf);
      imgStream.path = "engaged.jpg";

      return message.reply({
        body: messageBody,
        attachment: imgStream
      });

    } catch (err) {
      console.error("engaged error:", err);
      return message.reply("❌ Engaged command failed.");
    }
  }
};
