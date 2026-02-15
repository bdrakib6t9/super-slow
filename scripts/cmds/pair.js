const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");
const { getAvatarUrl } = require("../../rakib/customApi/getAvatarUrl");

module.exports = {
  config: {
    name: "pair",
    author: "Rakib",
    category: "love",
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      const senderID = event.senderID;

      const senderData = await usersData.get(senderID);
      const senderName = senderData.name;

      const threadData = await api.getThreadInfo(event.threadID);
      const users = threadData.userInfo;

      const myData = users.find(u => u.id === senderID);
      if (!myData || !myData.gender)
        return api.sendMessage("⚠️ Could not determine your gender.", event.threadID);

      const myGender = myData.gender;

      let matchCandidates = users.filter(
        u =>
          u.id !== senderID &&
          ((myGender === "MALE" && u.gender === "FEMALE") ||
           (myGender === "FEMALE" && u.gender === "MALE"))
      );

      if (!matchCandidates.length)
        return api.sendMessage("❌ No suitable match found.", event.threadID);

      const selectedMatch =
        matchCandidates[Math.floor(Math.random() * matchCandidates.length)];

      const matchName = selectedMatch.name;

      /* ================= BACKGROUND LIST ================= */

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
          type: "special200"
        },
        {
          url: "https://drive.google.com/uc?export=download&id=19QEwghmb2jOmmqeFG-9ouAWYtQyHd0NF",
          type: "special330"
        }
      ];

      const selectedBg =
        backgrounds[Math.floor(Math.random() * backgrounds.length)];

      async function loadDriveImage(url) {
        const res = await axios.get(url, {
          responseType: "arraybuffer",
          headers: { "User-Agent": "Mozilla/5.0" }
        });

        const contentType = res.headers["content-type"];
        if (!contentType || !contentType.includes("image")) {
          throw new Error("Drive returned non-image content");
        }

        return Buffer.from(res.data);
      }

      let bgBuffer;
      try {
        bgBuffer = await loadDriveImage(selectedBg.url);
      } catch (err) {
        return api.sendMessage("❌ Failed to load background image.", event.threadID);
      }

      const baseImage = await loadImage(bgBuffer);

      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

      /* ================= LOAD AVATARS ================= */

      const avatarPath1 = await getAvatarUrl(senderID).catch(() => null);
      const avatarPath2 = await getAvatarUrl(selectedMatch.id).catch(() => null);

      if (!avatarPath1 || !fs.existsSync(avatarPath1))
        return api.sendMessage("❌ Sender avatar not found.", event.threadID);

      if (!avatarPath2 || !fs.existsSync(avatarPath2))
        return api.sendMessage("❌ Match avatar not found.", event.threadID);

      const avatar1 = await loadImage(avatarPath1);
      const avatar2 = await loadImage(avatarPath2);

      /* ================= AVATAR DRAW ================= */

      if (selectedBg.type === "special200") {
        ctx.drawImage(avatar1, 955, 185, 200, 200);
        ctx.drawImage(avatar2, 115, 185, 200, 200);
      }
      else if (selectedBg.type === "special330") {
        ctx.drawImage(avatar1, 111, 175, 330, 330);
        ctx.drawImage(avatar2, 1018, 173, 330, 330);
      }
      else {
        ctx.drawImage(avatar1, 385, 40, 170, 170);
        ctx.drawImage(avatar2, canvas.width - 213, 190, 180, 170);
      }

      /* ================= FANCY FUNCTION ================= */

      function toFancy(text) {
        const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const fancy  = "𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁";
        return text.split("").map(char => {
          const index = normal.indexOf(char);
          return index !== -1 ? fancy[index] : char;
        }).join("");
      }

      const fancyName1 = toFancy(senderName);
      const fancyName2 = toFancy(matchName);

      const lovePercent = Math.floor(Math.random() * 31) + 70;
      const compatibility = Math.floor(Math.random() * 21) + 80;

      /* ================= SAVE & SEND ================= */

      const outputPath = path.join(__dirname, "pair_output.png");

      const out = fs.createWriteStream(outputPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);

      out.on("finish", () => {
        api.sendMessage(
          {
            body:
`💖✨ 𝐄𝐥𝐞𝐠𝐚𝐧𝐭 𝐏𝐚𝐢𝐫 𝐑𝐞𝐯𝐞𝐚𝐥 ✨💖
🌙 𝑻𝒐𝒏𝒊𝒈𝒉𝒕, 𝒅𝒆𝒔𝒕𝒊𝒏𝒚 𝒘𝒉𝒊𝒔𝒑𝒆𝒓𝒔 𝒔𝒐𝒇𝒕𝒍𝒚...
💫 𝑻𝒘𝒐 𝒔𝒐𝒖𝒍𝒔 𝒎𝒆𝒆𝒕 𝒖𝒏𝒅𝒆𝒓 𝒕𝒉𝒆 𝒈𝒍𝒐𝒘 𝒐𝒇 𝒇𝒂𝒕𝒆.
━━━━━━━━━━━━━━━
💞 ${senderName}
💞 ${matchName}
——————————
❤️ 𝑳𝒐𝒗𝒆 𝑹𝒂𝒕𝒊𝒏𝒈: ${lovePercent}%  
🌟 𝑺𝒐𝒖𝒍 𝑨𝒍𝒊𝒈𝒏𝒎𝒆𝒏𝒕: ${compatibility}%  
━━━━━━━━━━━━━━━
💌 𝑴𝒂𝒚 𝒕𝒉𝒊𝒔 𝒃𝒐𝒏𝒅 𝒈𝒓𝒐𝒘 𝒔𝒕𝒓𝒐𝒏𝒈𝒆𝒓 𝒆𝒗𝒆𝒓𝒚 𝒅𝒂𝒚 ✨`,
            attachment: fs.createReadStream(outputPath)
          },
          event.threadID,
          () => fs.unlinkSync(outputPath),
          event.messageID
        );
      });

    } catch (error) {
      api.sendMessage(
        "❌ Pair error:\n" + error.message,
        event.threadID,
        event.messageID
      );
    }
  }
};
