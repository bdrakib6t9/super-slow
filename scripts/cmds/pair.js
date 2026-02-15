const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "pair",
    author: "Rakib",
    version: "5.0",
    category: "love"
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      const senderID = event.senderID;

      // ---------- USER INFO ----------
      const senderData = await usersData.get(senderID);
      const senderName = senderData?.name || "User";

      const threadInfo = await api.getThreadInfo(event.threadID);
      const members = threadInfo.userInfo;

      const myData = members.find(u => u.id == senderID);
      if (!myData || !myData.gender) {
        return api.sendMessage(
          "⚠️ Could not determine your gender.",
          event.threadID,
          event.messageID
        );
      }

      const myGender = myData.gender;

      // ---------- FIND MATCH ----------
      let candidates = [];

      if (myGender === "MALE") {
        candidates = members.filter(
          u => u.gender === "FEMALE" && u.id != senderID
        );
      } else if (myGender === "FEMALE") {
        candidates = members.filter(
          u => u.gender === "MALE" && u.id != senderID
        );
      } else {
        return api.sendMessage(
          "⚠️ Gender undefined.",
          event.threadID,
          event.messageID
        );
      }

      if (!candidates.length) {
        return api.sendMessage(
          "❌ No suitable match found.",
          event.threadID,
          event.messageID
        );
      }

      const match = candidates[Math.floor(Math.random() * candidates.length)];
      const matchName = match.name;

      // ---------- AVATAR LOAD ----------
      const avatar1 = await usersData.getAvatarUrl(senderID);
      const avatar2 = await usersData.getAvatarUrl(match.id);

      const streamToBuffer = (stream) =>
        new Promise((resolve, reject) => {
          const chunks = [];
          stream.on("data", c => chunks.push(c));
          stream.on("end", () => resolve(Buffer.concat(chunks)));
          stream.on("error", reject);
        });

      const [buf1, buf2] = await Promise.all([
        streamToBuffer(await getStreamFromURL(avatar1)),
        streamToBuffer(await getStreamFromURL(avatar2))
      ]);

      const img1 = await loadImage(buf1);
      const img2 = await loadImage(buf2);

      // ---------- BACKGROUNDS ----------
      const backgrounds = [
        {
          url: "https://drive.google.com/uc?export=download&id=14tE4z8bZDv_Xco8V1WUgE4g0uZ-5CVYi",
          type: "normal"
        },
        {
          url: "https://drive.google.com/uc?export=download&id=1fMiWIjFjJk9q89JPyAYU4LHHfoM_3N4w",
          type: "normal"
        },
        {
          url: "https://drive.google.com/uc?export=download&id=1BJQy4sj7lStDL1flpuZROuav2Ez2Wy21",
          type: "normal"
        },
        {
          url: "https://drive.google.com/uc?export=download&id=1v3ix13pgp9Lkbl7MaF968SNPTOlkf_Y_",
          type: "special1"
        },
        {
          url: "https://drive.google.com/uc?export=download&id=19QEwghmb2jOmmqeFG-9ouAWYtQyHd0NF",
          type: "special2"
        }
      ];

      const selectedBg =
        backgrounds[Math.floor(Math.random() * backgrounds.length)];

      const bgBuffer = await streamToBuffer(
        await getStreamFromURL(selectedBg.url)
      );

      const background = await loadImage(bgBuffer);

      const canvas = createCanvas(background.width, background.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      // ---------- DRAW SYSTEM ----------
      if (selectedBg.type === "special1") {
        // 🔵 Special 1
        const AVATAR_SIZE = 200;
        ctx.drawImage(img1, 955, 185, AVATAR_SIZE, AVATAR_SIZE);
        ctx.drawImage(img2, 115, 185, AVATAR_SIZE, AVATAR_SIZE);

      } else if (selectedBg.type === "special2") {
        // 🟣 Special 2
        ctx.drawImage(img1, 111, 175, 330, 330);
        ctx.drawImage(img2, 1018, 173, 330, 330);

      } else {
        // 🟢 Normal
        const AVATAR_SIZE = 170;
        ctx.drawImage(img1, 385, 40, AVATAR_SIZE, AVATAR_SIZE);
        ctx.drawImage(img2, canvas.width - 213, 190, AVATAR_SIZE, AVATAR_SIZE);
      }

      // ---------- SAVE ----------
      const tmpDir = path.join(__dirname, "tmp");
      await fs.ensureDir(tmpDir);

      const filePath = path.join(tmpDir, `pair_${Date.now()}.png`);
      await fs.writeFile(filePath, canvas.toBuffer("image/png"));

      const lovePercent = Math.floor(Math.random() * 31) + 70;

      const text = `💖✨ 𝐄𝐥𝐞𝐠𝐚𝐧𝐭 𝐏𝐚𝐢𝐫 𝐑𝐞𝐯𝐞𝐚𝐥 ✨💖

💫 𝑻𝒐𝒏𝒊𝒈𝒉𝒕, 𝒅𝒆𝒔𝒕𝒊𝒏𝒚 𝒘𝒉𝒊𝒔𝒑𝒆𝒓𝒔 𝒔𝒐𝒇𝒕𝒍𝒚…
𝒕𝒘𝒐 𝒉𝒆𝒂𝒓𝒕𝒔 𝒂𝒍𝒊𝒈𝒏 𝒖𝒏𝒅𝒆𝒓 𝒕𝒉𝒆 𝒈𝒍𝒐𝒘 𝒐𝒇 𝒇𝒂𝒕𝒆.

💞 ${fancyName1}
💞 ${fancyName2}

❤️ 𝑳𝒐𝒗𝒆 𝑹𝒂𝒕𝒊𝒏𝒈: ${lovePercent}%  
🌟 𝑺𝒐𝒖𝒍 𝑨𝒍𝒊𝒈𝒏𝒎𝒆𝒏𝒕: ${compatibility}%

✨ 𝐌𝐚𝐲 𝐭𝐡𝐢𝐬 𝐜𝐨𝐧𝐧𝐞𝐜𝐭𝐢𝐨𝐧 𝐛𝐥𝐨𝐨𝐦 𝐰𝐢𝐭𝐡 𝐞𝐥𝐞𝐠𝐚𝐧𝐜𝐞, 𝐩𝐚𝐬𝐢𝐨𝐧,
𝐚𝐧𝐝 𝐚 𝐭𝐨𝐮𝐜𝐡 𝐨𝐟 𝐭𝐢𝐦𝐞𝐥𝐞𝐬𝐬 𝐫𝐨𝐦𝐚𝐧𝐜𝐞. ✨`;

      await api.sendMessage(
        {
          body: text,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        () => fs.unlink(filePath).catch(() => {}),
        event.messageID
      );

    } catch (err) {
      api.sendMessage(
        "❌ Error: " + err.message,
        event.threadID,
        event.messageID
      );
    }
  }
};
