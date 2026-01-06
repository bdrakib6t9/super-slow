const { getStreamFromURL } = global.utils;
const Jimp = require("jimp");
const { Readable } = require("stream");

module.exports = {
  config: {
    name: "pairme",
    version: "1.0",
    author: "Rakib + hoon",
    category: "love",
    guide: "{prefix}pairme [@mention/reply]"
  },

  onStart: async function ({ event, threadsData, message, usersData }) {
    try {
      const uidI = event.senderID;

      const threadData = await threadsData.get(event.threadID);
      if (!threadData) return message.reply("❌ Thread data not available.");

      const members = threadData.members || [];
      const senderInfo = members.find(m => String(m.userID) === String(uidI));
      if (!senderInfo) return message.reply("❌ Could not find your info in this group.");

      // ছোট helper
      const findMember = (id) =>
        members.find(m => String(m.userID) === String(id));

      // sender basic info
      let name1 = await usersData.getName(uidI).catch(() => null);
      if (!name1) name1 = senderInfo?.name || senderInfo?.fullName || "Unknown User";

      let avatarUrl1 = await usersData.getAvatarUrl(uidI).catch(() => null);

      const gender1 = senderInfo?.gender;

      // target নির্ধারণ: reply > mention > random
      let targetId = null;

      // 1) reply থাকলে
      if (event.type === "message_reply" && event.messageReply && event.messageReply.senderID) {
        targetId = String(event.messageReply.senderID);
      }

      // 2) না থাকলে mention থেকে
      if (!targetId && event.mentions && Object.keys(event.mentions).length > 0) {
        targetId = String(Object.keys(event.mentions)[0]);
      }

      let mode = "random"; // "random" or "fixed"
      let matchedUserId = null;

      if (targetId && targetId !== String(uidI)) {
        mode = "fixed";
        matchedUserId = targetId;
      }

      // যদি না reply, না mention -> random opposite gender
      const tryPickRandom = () => {
        const targetGender = gender1 === "MALE" ? "FEMALE" : (gender1 === "FEMALE" ? "MALE" : null);
        let list = [];

        if (targetGender) {
          list = members.filter(
            m =>
              m.gender === targetGender &&
              m.inGroup &&
              String(m.userID) !== String(uidI)
          );
        }

        // যদি opposite gender না পায়, তাহলে যে কেউ (self বাদে)
        if (!list.length) {
          list = members.filter(
            m => m.inGroup && String(m.userID) !== String(uidI)
          );
        }

        if (!list.length) return null;
        return list[Math.floor(Math.random() * list.length)];
      };

      let matchedInfo = null;

      if (mode === "fixed") {
        matchedInfo = findMember(matchedUserId);
        if (!matchedInfo) {
          // fallback random
          matchedInfo = tryPickRandom();
        }
      } else {
        matchedInfo = tryPickRandom();
      }

      if (!matchedInfo) {
        return message.reply("❌ Could not find anyone to pair with you.");
      }

      const matchedId = matchedInfo.userID;

      let name2 = await usersData.getName(matchedId).catch(() => null);
      if (!name2) name2 = matchedInfo?.name || matchedInfo?.fullName || "Unknown User";

      let avatarUrl2 = await usersData.getAvatarUrl(matchedId).catch(() => null);

      const gender2 = matchedInfo?.gender;

      // Percent
      const lovePercent = Math.floor(Math.random() * 36) + 65;
      const compatibility = Math.floor(Math.random() * 36) + 65;

      // ---------- Fancy italic name ----------
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

      // ---------- Fun note (same-gender cases) ----------
      let funNote = "";
      if (gender1 && gender2 && gender1 === "MALE" && gender2 === "MALE") {
        funNote = "🤣 Bromance level: 999+… are you two sure this is *just* friendship? 👀";
      } else if (gender1 && gender2 && gender1 === "FEMALE" && gender2 === "FEMALE") {
        funNote = "👀 Girl power detected… this vibe is dangerously cute ✨";
      }

      // ---------- Final message ----------
      const msgLines = [];

      msgLines.push("💖✨ 𝐄𝐥𝐞𝐠𝐚𝐧𝐭 𝐏𝐚𝐢𝐫 𝐑𝐞𝐯𝐞𝐚𝐥 ✨💖");
      msgLines.push("");
      msgLines.push("💫 𝑻𝒐𝒏𝒊𝒈𝒉𝒕, 𝒅𝒆𝒔𝒕𝒊𝒏𝒚 𝒘𝒉𝒊𝒔𝒑𝒆𝒓𝒔 𝒔𝒐𝒇𝒕𝒍𝒚…");
      msgLines.push("𝒕𝒘𝒐 𝒉𝒆𝒂𝒓𝒕𝒔 𝒂𝒍𝒊𝒈𝒏 𝒖𝒏𝒅𝒆𝒓 𝒕𝒉𝒆 𝒈𝒍𝒐𝒘 𝒐𝒇 𝒇𝒂𝒕𝒆.");
      msgLines.push("");

      if (funNote) {
        msgLines.push(funNote);
        msgLines.push("");
      }

      msgLines.push(`💞 ${fancyName1}`);
      msgLines.push(`💞 ${fancyName2}`);
      msgLines.push("");
      msgLines.push(`❤️ 𝑳𝒐𝒗𝒆 𝑹𝒂𝒕𝒊𝒏𝒈: ${lovePercent}%`);
      msgLines.push(`🌟 𝑺𝒐𝒖𝒍 𝑨𝒍𝒊𝒈𝒏𝒎𝒆𝒏𝒕: ${compatibility}%`);
      msgLines.push("");
      msgLines.push("✨ 𝐌𝐚𝐲 𝐭𝐡𝐢𝐬 𝐜𝐨𝐧𝐧𝐞𝐜𝐭𝐢𝐨𝐧 𝐛𝐥𝐨𝐨𝐦 𝐰𝐢𝐭𝐡 𝐞𝐥𝐞𝐠𝐚𝐧𝐜𝐞, 𝐩𝐚𝐬𝐬𝐢𝐨𝐧,");
      msgLines.push("𝐚𝐧𝐝 𝐚 𝐭𝐨𝐮𝐜𝐡 𝐨𝐟 𝐭𝐢𝐦𝐞𝐥𝐞𝐬𝐬 𝐫𝐨𝐦𝐚𝐧𝐜𝐞. ✨");

      const msg = msgLines.join("\n");

      // ---------- IMAGE GENERATION WITH JIMP ----------
      const streamToBuffer = (stream) => new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", c => chunks.push(c));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", reject);
      });

      const bgUrls = [
        "https://raw.githubusercontent.com/bdrakib12/baby-goat-bot/main/scripts/cmds/cache/pair.png",
        "https://i.postimg.cc/cJNqywkj/pair.png"
      ];

      let bgImage = null;
      for (const url of bgUrls) {
        try {
          const bgStream = await getStreamFromURL(url);
          const bgBuffer = await streamToBuffer(bgStream);
          bgImage = await Jimp.read(bgBuffer);
          break;
        } catch (e) {
          console.warn("Failed to load background from", url, e);
        }
      }

      if (!bgImage) {
        return message.reply(msg);
      }

      const bg = bgImage;

      const AVATAR_SIZE = 200;
      const circleOnePos = { x: 955, y: 185 }; // sender
      const circleTwoPos = { x: 115, y: 185 }; // target

      async function loadAvatar(url, fallbackName) {
        if (!url) {
          return createPlaceholderAvatar(fallbackName);
        }
        try {
          const avStream = await getStreamFromURL(url);
          const avBuffer = await streamToBuffer(avStream);
          const img = await Jimp.read(avBuffer);
          return img;
        } catch (e) {
          console.warn("Failed to load avatar:", url, e);
          return createPlaceholderAvatar(fallbackName);
        }
      }

      function createPlaceholderAvatar(name) {
        const img = new Jimp(AVATAR_SIZE, AVATAR_SIZE, "#f0f0ff");
        const initials = String(name || "U")
          .split(" ")
          .map(w => w[0])
          .filter(Boolean)
          .slice(0, 2)
          .join("")
          .toUpperCase();

        return Jimp.loadFont(Jimp.FONT_SANS_32_BLACK)
          .then(font => {
            img.print(
              font,
              0,
              0,
              {
                text: initials,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
              },
              AVATAR_SIZE,
              AVATAR_SIZE
            );
            return img;
          });
      }

      let img1 = await loadAvatar(avatarUrl1, name1);
      let img2 = await loadAvatar(avatarUrl2, name2);

      if (img1 instanceof Promise) img1 = await img1;
      if (img2 instanceof Promise) img2 = await img2;

      img1 = img1.resize(AVATAR_SIZE, AVATAR_SIZE).circle();
      img2 = img2.resize(AVATAR_SIZE, AVATAR_SIZE).circle();

      bg.composite(img1, circleOnePos.x, circleOnePos.y);
      bg.composite(img2, circleTwoPos.x, circleTwoPos.y);

      // নিচে ছোট percent line (optional)
      try {
        const fontWhite = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
        const textLine = `❤ ${lovePercent}%   •   🌟 ${compatibility}%`;
        bg.print(
          fontWhite,
          0,
          bg.bitmap.height - 80,
          {
            text: textLine,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
          },
          bg.bitmap.width,
          40
        );
      } catch (e) {
        console.warn("Failed to print text on image:", e);
      }

      const finalBuffer = await bg.getBufferAsync(Jimp.MIME_PNG);
      const imgStream = Readable.from(finalBuffer);
      imgStream.path = "pairme.png";

      return message.reply({
        body: msg,
        attachment: imgStream
      });

    } catch (err) {
      console.error("pairme command error:", err);
      return message.reply("❌ An unexpected error occurred. Please try again later.");
    }
  }
};
