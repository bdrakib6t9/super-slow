const fs = require("fs");
const { getStreamFromURL } = global.utils;
const { getAvatarUrl } = require("../../rakib/customApi/getAvatarUrl");
const Jimp = require("jimp");
const { Readable } = require("stream");

module.exports = {
  config: {
    name: "toilet",
    version: "1.0",
    author: "Rakib",
    category: "fun",
    guide: "{prefix}toilet @mention | reply"
  },

  onStart: async function ({ event, threadsData, message, usersData }) {
    try {
      const senderID = event.senderID;

      // -------------------------
      // TARGET (reply > mention)
      // -------------------------
      let targetID = null;

      if (event.type === "message_reply" && event.messageReply?.senderID) {
        targetID = event.messageReply.senderID;
      } else if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      }

      if (!targetID) {
        return message.reply("❌ কাউকে reply বা mention করুন।");
      }

      // -------------------------
      // USER DATA
      // -------------------------
      const threadData = await threadsData.get(event.threadID);
      const members = threadData?.members || [];

      const senderInfo = members.find(m => String(m.userID) === String(senderID));
      const targetInfo = members.find(m => String(m.userID) === String(targetID));

      const name1 = await usersData.getName(senderID)
        .catch(() => senderInfo?.name || "User1");

      const name2 = await usersData.getName(targetID)
        .catch(() => targetInfo?.name || "User2");

      // 🔥 Local avatar path
      const avatarPath1 = await getAvatarUrl(senderID).catch(() => null);
      const avatarPath2 = await getAvatarUrl(targetID).catch(() => null);

      // -------------------------
      // BACKGROUND (Drive direct link format)
      // -------------------------
      const bgUrl =
        "https://drive.google.com/uc?export=download&id=1N2W_xQVPDVJ2w-a8L-YC0D2BrSpZ8HIZ";

      const streamToBuffer = (stream) =>
        new Promise((resolve, reject) => {
          const chunks = [];
          stream.on("data", c => chunks.push(c));
          stream.on("end", () => resolve(Buffer.concat(chunks)));
          stream.on("error", reject);
        });

      const bgStream = await getStreamFromURL(bgUrl);
      const bgBuffer = await streamToBuffer(bgStream);

      let hon_img = await Jimp.read(bgBuffer);

      // resize as requested
      hon_img = hon_img.resize(292, 345);

      // -------------------------
      // LOAD AVATAR
      // -------------------------
      async function loadAvatar(localPath, fallbackName) {
        try {
          if (localPath && fs.existsSync(localPath)) {
            return await Jimp.read(localPath);
          }
        } catch {}

        // placeholder
        const img = new Jimp(70, 70, "#999");
        const letter = (fallbackName[0] || "U").toUpperCase();
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
        img.print(
          font,
          0,
          0,
          {
            text: letter,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
          },
          70,
          70
        );
        return img;
      }

      let circleOne = await loadAvatar(avatarPath1, name1);
      let circleTwo = await loadAvatar(avatarPath2, name2);

      circleOne = circleOne.resize(70, 70).circle();
      circleTwo = circleTwo.resize(70, 70).circle();

      // -------------------------
      // COMPOSITE (as you requested)
      // -------------------------
      hon_img
        .composite(circleOne, 100, 200)
        .composite(circleTwo, 100, 200);

      // -------------------------
      // EXPORT
      // -------------------------
      const outBuffer = await hon_img.getBufferAsync(Jimp.MIME_PNG);
      const imgStream = Readable.from(outBuffer);
      imgStream.path = "toilet.png";

      return message.reply({
        body: `🚽 ${name1} & ${name2} in toilet mode 😆`,
        attachment: imgStream
      });

    } catch (err) {
      console.error("toilet command error:", err);
      return message.reply("❌ Toilet command failed.");
    }
  }
};
