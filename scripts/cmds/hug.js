const { getStreamFromURL } = global.utils;
const Jimp = require("jimp");
const { Readable } = require("stream");

module.exports = {
  config: {
    name: "hug",
    version: "1.0",
    author: "Rakib + hoon",
    category: "fun",
    guide: "{prefix}hug [@mention/reply]"
  },

  onStart: async function ({ event, threadsData, message, usersData }) {
    try {
      const uidI = event.senderID;

      const threadData = await threadsData.get(event.threadID);
      if (!threadData) return message.reply("❌ Thread data not available.");

      const members = threadData.members || [];
      const senderInfo = members.find(m => String(m.userID) === String(uidI));
      if (!senderInfo) return message.reply("❌ Could not find your info in this group.");

      // helper to find member by id
      const findMember = (id) => members.find(m => String(m.userID) === String(id));

      // sender info
      let name1 = await usersData.getName(uidI).catch(() => null);
      if (!name1) name1 = senderInfo?.name || senderInfo?.fullName || "Unknown User";
      let avatarUrl1 = await usersData.getAvatarUrl(uidI).catch(() => null);

      // determine target: reply > mention > random
      let targetId = null;
      if (event.type === "message_reply" && event.messageReply?.senderID) {
        targetId = String(event.messageReply.senderID);
      }
      if (!targetId && event.mentions && Object.keys(event.mentions).length > 0) {
        targetId = String(Object.keys(event.mentions)[0]);
      }

      const pickRandom = () => {
        const list = members.filter(m => m.inGroup && String(m.userID) !== String(uidI));
        if (!list.length) return null;
        return list[Math.floor(Math.random() * list.length)];
      };

      let matchedInfo = null;
      if (targetId && targetId !== String(uidI)) matchedInfo = findMember(targetId);
      if (!matchedInfo) matchedInfo = pickRandom();
      if (!matchedInfo) return message.reply("❌ Could not find anyone to hug with you.");

      const matchedId = matchedInfo.userID;
      let name2 = await usersData.getName(matchedId).catch(() => null);
      if (!name2) name2 = matchedInfo?.name || matchedInfo?.fullName || "Unknown User";
      let avatarUrl2 = await usersData.getAvatarUrl(matchedId).catch(() => null);

      // message text (Bengali)
      const textBody = "তোমাকে জড়িয়ে ধরার মত ফিলিংস, পৃথিবীতে দ্বিতীয় আর কিছু নেই";

      // helper: stream -> buffer
      const streamToBuffer = (stream) => new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", c => chunks.push(c));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", err => reject(err));
      });

      // background urls: primary (postimg) then fallback (github)
      const bgUrls = [
        "https://i.postimg.cc/fbYrcw8Q/hug.jpg",
        "https://raw.githubusercontent.com/bdrakib12/baby-goat-bot/main/scripts/cmds/cache/hug.png"
      ];

      let bgImage = null;
      for (const url of bgUrls) {
        try {
          const s = await getStreamFromURL(url);
          const buf = await streamToBuffer(s);
          bgImage = await Jimp.read(buf);
          break;
        } catch (e) {
          console.warn("Failed to load background from", url, e);
        }
      }

      if (!bgImage) {
        // If background fails, just reply text
        return message.reply(textBody);
      }

      const bg = bgImage;

      // Avatar sizes & positions as requested
      const size1 = 150; // first avatar
      const pos1 = { x: 320, y: 100 };

      const size2 = 130; // second avatar
      const pos2 = { x: 280, y: 280 };

      async function loadAvatar(url, fallbackName) {
        if (!url) return createPlaceholderAvatar(fallbackName, Math.max(size1, size2));
        try {
          const s = await getStreamFromURL(url);
          const buf = await streamToBuffer(s);
          return await Jimp.read(buf);
        } catch (e) {
          console.warn("Failed to load avatar:", url, e);
          return createPlaceholderAvatar(fallbackName, Math.max(size1, size2));
        }
      }

      function createPlaceholderAvatar(name, size) {
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

      // load avatars
      let img1 = await loadAvatar(avatarUrl1, name1);
      let img2 = await loadAvatar(avatarUrl2, name2);

      if (img1 instanceof Promise) img1 = await img1;
      if (img2 instanceof Promise) img2 = await img2;

      // resize & circle
      img1 = img1.resize(size1, size1).circle();
      img2 = img2.resize(size2, size2).circle();

      // composite onto background
      bg.composite(img1, pos1.x, pos1.y);
      bg.composite(img2, pos2.x, pos2.y);

      // print Bengali text onto image (centered near bottom)
      try {
        // choose a font; white with shadow effect by printing dark shadow first
        const fontWhite = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
        const fontBlack = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);

        const textWidth = bg.bitmap.width - 40;
        const textX = 20;
        const textY = bg.bitmap.height - 120;

        // shadow
        bg.print(
          fontBlack,
          textX + 2,
          textY + 2,
          {
            text: textBody,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
          },
          textWidth,
          80
        );

        // main white text
        bg.print(
          fontWhite,
          textX,
          textY,
          {
            text: textBody,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
          },
          textWidth,
          80
        );
      } catch (e) {
        console.warn("Failed to print text on hug image:", e);
      }

      const finalBuffer = await bg.getBufferAsync(Jimp.MIME_PNG);
      const imgStream = Readable.from(finalBuffer);
      imgStream.path = "hug.png";

      return message.reply({
        body: textBody,
        attachment: imgStream
      });

    } catch (err) {
      console.error("hug command error:", err);
      return message.reply("❌ An unexpected error occurred. Please try again later.");
    }
  }
};
