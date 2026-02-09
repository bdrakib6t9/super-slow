const { getStreamFromURL } = global.utils;
const Jimp = require("jimp");
const { Readable } = require("stream");
const fs = require("fs");
const { getAvatarUrl } = require("../../rakib/customApi/getAvatarUrl");

module.exports = {
  config: {
    name: "pairme",
    version: "1.1",
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
      if (!senderInfo) {
        return message.reply("❌ Could not find your info in this group.");
      }

      const findMember = (id) =>
        members.find(m => String(m.userID) === String(id));

      /* ================= SENDER ================= */
      let name1 = await usersData.getName(uidI).catch(() => null);
      if (!name1) name1 = senderInfo?.name || senderInfo?.fullName || "Unknown User";

      const avatarPath1 = await getAvatarUrl(uidI).catch(() => null);
      const gender1 = senderInfo?.gender;

      /* ================= TARGET (reply > mention > random) ================= */
      let targetId = null;

      if (event.type === "message_reply" && event.messageReply?.senderID) {
        targetId = String(event.messageReply.senderID);
      }

      if (!targetId && event.mentions && Object.keys(event.mentions).length > 0) {
        targetId = String(Object.keys(event.mentions)[0]);
      }

      let mode = "random";
      let matchedUserId = null;

      if (targetId && targetId !== String(uidI)) {
        mode = "fixed";
        matchedUserId = targetId;
      }

      const tryPickRandom = () => {
        const targetGender =
          gender1 === "MALE" ? "FEMALE" :
          gender1 === "FEMALE" ? "MALE" : null;

        let list = [];

        if (targetGender) {
          list = members.filter(
            m =>
              m.gender === targetGender &&
              m.inGroup &&
              String(m.userID) !== String(uidI)
          );
        }

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
        matchedInfo = findMember(matchedUserId) || tryPickRandom();
      } else {
        matchedInfo = tryPickRandom();
      }

      if (!matchedInfo) {
        return message.reply("❌ Could not find anyone to pair with you.");
      }

      const matchedId = matchedInfo.userID;

      let name2 = await usersData.getName(matchedId).catch(() => null);
      if (!name2) name2 = matchedInfo?.name || matchedInfo?.fullName || "Unknown User";

      const avatarPath2 = await getAvatarUrl(matchedId).catch(() => null);
      const gender2 = matchedInfo?.gender;

      /* ================= PERCENT ================= */
      const lovePercent = Math.floor(Math.random() * 36) + 65;
      const compatibility = Math.floor(Math.random() * 36) + 65;

      /* ================= FANCY ITALIC ================= */
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

      let funNote = "";
      if (gender1 === "MALE" && gender2 === "MALE") {
        funNote = "🤣 Bromance level: 999+… are you two sure this is just friendship? 👀";
      } else if (gender1 === "FEMALE" && gender2 === "FEMALE") {
        funNote = "👀 Girl power detected… this vibe is dangerously cute ✨";
      }

      /* ================= MESSAGE ================= */
      const msg =
`💖✨ 𝐄𝐥𝐞𝐠𝐚𝐧𝐭 𝐏𝐚𝐢𝐫 𝐑𝐞𝐯𝐞𝐚𝐥 ✨💖

💫 Tonight, destiny whispers softly…
two hearts align under the glow of fate.

${funNote ? funNote + "\n\n" : ""}💞 ${fancyName1}
💞 ${fancyName2}

❤️ Love Rating: ${lovePercent}%
🌟 Soul Alignment: ${compatibility}%

✨ May this connection bloom with elegance,
passion, and timeless romance. ✨`;

      /* ================= BACKGROUND ================= */
      const bgUrls = [
        "https://raw.githubusercontent.com/bdrakib12/baby-goat-bot/main/scripts/cmds/cache/pair.png",
        "https://i.postimg.cc/cJNqywkj/pair.png"
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

      /* ================= AVATARS ================= */
      const AVATAR_SIZE = 200;
      const pos1 = { x: 955, y: 185 };
      const pos2 = { x: 115, y: 185 };

      async function loadAvatar(localPath, fallbackName) {
        try {
          if (localPath && fs.existsSync(localPath)) {
            return await Jimp.read(localPath);
          }
        } catch {}
        return createPlaceholderAvatar(fallbackName);
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
            AVATAR_SIZE,
            AVATAR_SIZE
          );
          return img;
        });
      }

      let img1 = await loadAvatar(avatarPath1, name1);
      let img2 = await loadAvatar(avatarPath2, name2);

      img1 = img1.resize(AVATAR_SIZE, AVATAR_SIZE).circle();
      img2 = img2.resize(AVATAR_SIZE, AVATAR_SIZE).circle();

      bg.composite(img1, pos1.x, pos1.y);
      bg.composite(img2, pos2.x, pos2.y);

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
      } catch {}

      /* ================= OUTPUT ================= */
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
