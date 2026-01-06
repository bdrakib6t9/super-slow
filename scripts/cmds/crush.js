const { getStreamFromURL } = global.utils;
const Jimp = require("jimp");
const { Readable } = require("stream");

module.exports = {
  config: {
    name: "crush",
    version: "1.1",
    author: "Rakib + hoon",
    category: "love",
    guide: "{prefix}crush [@mention/reply]"
  },

  onStart: async function ({ event, threadsData, message, usersData }) {
    try {
      const uidI = event.senderID;

      const threadData = await threadsData.get(event.threadID);
      if (!threadData) return message.reply("❌ Thread data not available.");

      const members = threadData.members || [];
      const senderInfo = members.find(m => String(m.userID) === String(uidI));
      if (!senderInfo) return message.reply("❌ Could not find your info in this group.");

      const findMember = (id) =>
        members.find(m => String(m.userID) === String(id));

      // sender info
      let name1 = await usersData.getName(uidI).catch(() => null);
      if (!name1) name1 = senderInfo?.name || senderInfo?.fullName || "Unknown User";

      let avatarUrl1 = await usersData.getAvatarUrl(uidI).catch(() => null);
      const gender1 = senderInfo?.gender;

      // ---------- target নির্বাচন ----------
      let targetId = null;

      if (event.type === "message_reply" && event.messageReply?.senderID) {
        targetId = String(event.messageReply.senderID);
      }

      if (!targetId && event.mentions && Object.keys(event.mentions).length > 0) {
        targetId = String(Object.keys(event.mentions)[0]);
      }

      const pickRandomCrush = () => {
        const targetGender = gender1 === "MALE" ? "FEMALE" : gender1 === "FEMALE" ? "MALE" : null;
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
      if (targetId && targetId !== String(uidI)) matchedInfo = findMember(targetId);
      if (!matchedInfo) matchedInfo = pickRandomCrush();
      if (!matchedInfo) return message.reply("❌ Could not find anyone to crush with you.");

      const matchedId = matchedInfo.userID;

      let name2 = await usersData.getName(matchedId).catch(() => null);
      if (!name2) name2 = matchedInfo?.name || matchedInfo?.fullName || "Unknown User";

      let avatarUrl2 = await usersData.getAvatarUrl(matchedId).catch(() => null);

      const lovePercent = Math.floor(Math.random() * 41) + 60;
      const crushIntensity = Math.floor(Math.random() * 41) + 60;

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

      // ---------- Crush Message ----------
      const msg =
`💘✨ 𝐂𝐫𝐮𝐬𝐡 𝐌𝐚𝐭𝐜𝐡 𝐃𝐞𝐭𝐞𝐜𝐭𝐞𝐝 ✨💘

💫 𝑺𝒐𝒎𝒆𝒕𝒊𝒎𝒆𝒔 𝒂 𝒔𝒎𝒂𝒍𝒍 𝒄𝒓𝒖𝒔𝒉 𝒊𝒔 𝒂𝒍𝒍 𝒊𝒕 𝒕𝒂𝒌𝒆𝒔 
𝒕𝒐 𝒎𝒂𝒌𝒆 𝒕𝒉𝒆 𝒅𝒂𝒚 𝒇𝒆𝒆𝒍 𝒔𝒑𝒆𝒄𝒊𝒂𝒍. 💭

💞 ${fancyName1}
💞 ${fancyName2}

❤️ 𝑪𝒓𝒖𝒔𝒉 𝑳𝒆𝒗𝒆𝒍: ${lovePercent}%  
🌟 𝑯𝒆𝒂𝒓𝒕 𝑽𝒊𝒃𝒆: ${crushIntensity}%

✨ 𝑴𝒂𝒚 𝒕𝒉𝒊𝒔 𝒄𝒓𝒖𝒔𝒉 𝒃𝒓𝒊𝒏𝒈 𝒔𝒎𝒊𝒍𝒆𝒔, 𝒔𝒘𝒆𝒆𝒕 𝒎𝒐𝒎𝒆𝒏𝒕𝒔, 
𝒂𝒏𝒅 𝒂 𝒍𝒊𝒕𝒕𝒍𝒆 𝒎𝒂𝒈𝒊𝒄 𝒕𝒐 𝒚𝒐𝒖𝒓 𝒅𝒂𝒚. ✨`;

      const streamToBuffer = (stream) => new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", c => chunks.push(c));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", reject);
      });

      // UPDATED BACKGROUND
      const bgUrl = "https://i.postimg.cc/YSPw1cdy/crush.jpg";

      let bgImage;
      try {
        const bgStream = await getStreamFromURL(bgUrl);
        const bgBuffer = await streamToBuffer(bgStream);
        bgImage = await Jimp.read(bgBuffer);
      } catch (e) {
        console.warn("Failed to load crush background:", e);
        return message.reply(msg);
      }

      const bg = bgImage;

      const pos1 = { x: 93, y: 111 };
      const pos2 = { x: 434, y: 107 };
      const size1 = 191;
      const size2 = 190;

      async function loadAvatar(url, fallbackName) {
        if (!url) return createPlaceholderAvatar(fallbackName);
        try {
          const avStream = await getStreamFromURL(url);
          const avBuffer = await streamToBuffer(avStream);
          return await Jimp.read(avBuffer);
        } catch {
          return createPlaceholderAvatar(fallbackName);
        }
      }

      function createPlaceholderAvatar(name) {
        const size = 200;
        const img = new Jimp(size, size, "#f0f0ff");
        const initials = name
          .split(" ")
          .map(w => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return Jimp.loadFont(Jimp.FONT_SANS_32_BLACK).then(font => {
          img.print(font, 0, 0, {
            text: initials,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
          }, size, size);
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
      imgStream.path = "crush.png";

      return message.reply({
        body: msg,
        attachment: imgStream
      });

    } catch (err) {
      console.error("crush command error:", err);
      return message.reply("❌ An unexpected error occurred. Please try again later.");
    }
  }
};
