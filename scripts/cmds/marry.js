const { getStreamFromURL } = global.utils;
const Jimp = require("jimp");
const { Readable } = require("stream");

module.exports = {
  config: {
    name: "marry",
    version: "1.2",
    author: "Rakib + hoon",
    category: "fun",
    guide: "{prefix}marry [@mention/reply]"
  },

  onStart: async function ({ event, threadsData, message, usersData }) {
    try {
      const uidI = event.senderID;

      const threadData = await threadsData.get(event.threadID);
      if (!threadData) return message.reply("❌ Thread data not available.");

      const members = threadData.members || [];
      const senderInfo = members.find(m => String(m.userID) === String(uidI));
      if (!senderInfo) return message.reply("❌ Could not find your info in this group.");

      // helper
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
      if (!matchedInfo) return message.reply("❌ Could not find anyone to marry with you.");

      const matchedId = matchedInfo.userID;
      let name2 = await usersData.getName(matchedId).catch(() => null);
      if (!name2) name2 = matchedInfo?.name || matchedInfo?.fullName || "Unknown User";
      let avatarUrl2 = await usersData.getAvatarUrl(matchedId).catch(() => null);

      // fancy italic names
      function toFancyItalic(inputName) {
        const name = String(inputName || "");
        const map = {
          A: "𝑨", B: "𝑩", C: "𝑪", D: "𝑫", E: "𝑬", F: "𝑭", G: "𝑮", H: "𝑯",
          I: "𝑰", J: "𝑱", K: "𝑲", L: "𝑳", M: "𝑴", N: "𝑵", O: "𝑶", P: "𝑷",
          Q: "𝑸", R: "𝑹", S: "𝑺", T: "𝑻", U: "𝑼", V: "𝑽", W: "𝑾", X: "𝑿",
          Y: "𝒀", Z: "𝒁",
          a: "𝒂", b: "𝒃", c: "𝒄", d: "𝒅", e: "𝒆", f: "𝒇", g: "𝒈", h: "𝒉",
          i: "𝒊", j: "𝒋", k: "𝒌", l: "𝒍", m: "𝒎", n: "𝒏", o: "𝒐", p: "𝒑",
          q: "𝒒", r: "𝒓", s: "𝒔", t: "𝒕", u: "𝒖", v: "𝒗", w: "𝒘", x: "𝒙",
          y: "𝒚", z: "𝒛"
        };
        return name.split("").map(ch => map[ch] || ch).join("");
      }

      const fancyName1 = toFancyItalic(name1);
      const fancyName2 = toFancyItalic(name2);

      // marriage text (Bengali)
      const marriageText = "দাম্পত্য জীবনের সৌন্দর্য হল: একে অপরের ছোট ছোট ভুল মাফ করে, প্রতিদিন একসাথে হাসার একটি কারণ খোঁজা।";

      // helper: stream -> buffer
      const streamToBuffer = (stream) => new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", c => chunks.push(c));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", reject);
      });

      // background urls (primary postimg jpg then fallback github png)
      const bgUrls = [
        "https://i.postimg.cc/prLcMKx3/marry.jpg",
        "https://raw.githubusercontent.com/bdrakib12/baby-goat-bot/main/scripts/cmds/cache/marry.png"
      ];

      let bgImage = null;
      for (const url of bgUrls) {
        try {
          const s = await getStreamFromURL(url);
          const buf = await streamToBuffer(s);
          bgImage = await Jimp.read(buf);
          break;
        } catch (e) {
          console.warn("Failed to load marry background from:", url, e);
        }
      }

      if (!bgImage) {
        // if background fails, reply with text only
        const fallbackMsg = `👰🤵 ${fancyName1} + ${fancyName2}\n\n${marriageText}`;
        return message.reply(fallbackMsg);
      }

      const bg = bgImage;
      // Use the pixel-perfect coordinates you requested with 180x180 avatars:
      const AVATAR_SIZE = 100;

      // Bride (left) top-left at (265, 130)
      const bridePos = { x: 210, y: 130 };
      // Groom (right) top-left at (585, 270)
      const groomPos = { x: 100, y: 170 };

      async function loadAvatar(url, fallbackName) {
        if (!url) return createPlaceholderAvatar(fallbackName, AVATAR_SIZE);
        try {
          const s = await getStreamFromURL(url);
          const buf = await streamToBuffer(s);
          const img = await Jimp.read(buf);
          return img;
        } catch (e) {
          console.warn("Failed to load avatar:", url, e);
          return createPlaceholderAvatar(fallbackName, AVATAR_SIZE);
        }
      }

      function createPlaceholderAvatar(name, size) {
        const img = new Jimp(size, size, "#f7f7fa");
        const initials = String(name || "U")
          .split(" ")
          .map(w => w[0])
          .filter(Boolean)
          .slice(0, 2)
          .join("")
          .toUpperCase();
        return Jimp.loadFont(Jimp.FONT_SANS_32_BLACK).then(font => {
          img.print(font, 0, 0, {
            text: initials,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
          }, size, size);
          return img;
        });
      }

      let brideAvatar = await loadAvatar(avatarUrl1, name1);
      let groomAvatar = await loadAvatar(avatarUrl2, name2);

      if (brideAvatar instanceof Promise) brideAvatar = await brideAvatar;
      if (groomAvatar instanceof Promise) groomAvatar = await groomAvatar;

      brideAvatar = brideAvatar.resize(AVATAR_SIZE, AVATAR_SIZE).circle();
      groomAvatar = groomAvatar.resize(AVATAR_SIZE, AVATAR_SIZE).circle();

      // composite onto background at exact coordinates
      bg.composite(brideAvatar, bridePos.x, bridePos.y);
      bg.composite(groomAvatar, groomPos.x, groomPos.y);

      // Print names + marriage text onto the image
      try {
        const fontTitle = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
        const fontSub = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);

        // Title: names centered
        const title = `👰 ${fancyName1}   ＆   🤵 ${fancyName2}`;
        bg.print(
          fontTitle,
          0,
          Math.floor(bg.bitmap.height * 0.72),
          {
            text: title,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
          },
          bg.bitmap.width,
          40
        );

        // Marriage text
        bg.print(
          fontSub,
          40,
          Math.floor(bg.bitmap.height * 0.78),
          {
            text: marriageText,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
          },
          bg.bitmap.width - 80,
          80
        );
      } catch (e) {
        console.warn("Failed to print text on marry image:", e);
      }

      // export
      const finalBuffer = await bg.getBufferAsync(Jimp.MIME_PNG);
      const imgStream = Readable.from(finalBuffer);
      imgStream.path = "marry.png";

      // message body
      const bodyMsg = `👰🤵 ${fancyName1} + ${fancyName2}\n\n${marriageText}`;

      return message.reply({
        body: bodyMsg,
        attachment: imgStream
      });

    } catch (err) {
      console.error("marry command error:", err);
      return message.reply("❌ An unexpected error occurred. Please try again later.");
    }
  }
};
