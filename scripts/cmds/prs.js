const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const { getStreamFromURL } = global.utils;
const { getAvatarUrl } = require("../../rakib/customApi/getAvatarUrl");

module.exports = {
  config: {
    name: "prs",
    author: "Rakib",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Get to know your partner",
    },
    longDescription: {
      en: "Know your destiny and know who you will complete your life with",
    },
    category: "love",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      const id1 = event.senderID;
      const name1 = await usersData.getName(id1);

      /* ================= THREAD INFO ================= */
      const threadInfo = await api.getThreadInfo(event.threadID);
      const all = threadInfo.userInfo || [];

      let gender1;
      for (const u of all) {
        if (String(u.id) === String(id1)) {
          gender1 = u.gender;
          break;
        }
      }

      const botID = api.getCurrentUserID();
      let candidates = [];

      if (gender1 === "FEMALE") {
        candidates = all.filter(
          u => u.gender === "MALE" && u.id !== id1 && u.id !== botID
        );
      } else if (gender1 === "MALE") {
        candidates = all.filter(
          u => u.gender === "FEMALE" && u.id !== id1 && u.id !== botID
        );
      } else {
        candidates = all.filter(
          u => u.id !== id1 && u.id !== botID
        );
      }

      if (!candidates.length) {
        return api.sendMessage(
          "❌ No suitable partner found in this group.",
          event.threadID,
          event.messageID
        );
      }

      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      const id2 = pick.id;
      const name2 = await usersData.getName(id2);

      /* ================= LOVE % ================= */
      const rd1 = Math.floor(Math.random() * 100) + 1;
      const cc = ["0", "-1", "99.99", "-99", "-100", "101", "0.01"];
      const djtme = [rd1, rd1, rd1, rd1, rd1, rd2 = cc[Math.floor(Math.random() * cc.length)], rd1, rd1, rd1, rd1];
      const tile = djtme[Math.floor(Math.random() * djtme.length)];

      /* ================= BACKGROUND ================= */
      const bgUrls = [
        "https://drive.google.com/uc?export=download&id=19QEwghmb2jOmmqeFG-9ouAWYtQyHd0NF"
      ];

      const streamToBuffer = (stream) =>
        new Promise((resolve, reject) => {
          const chunks = [];
          stream.on("data", c => chunks.push(c));
          stream.on("end", () => resolve(Buffer.concat(chunks)));
          stream.on("error", reject);
        });

      let bgBuffer = null;
      for (const url of bgUrls) {
        try {
          const s = await getStreamFromURL(url);
          bgBuffer = await streamToBuffer(s);
          break;
        } catch {}
      }

      if (!bgBuffer) {
        return api.sendMessage("❌ Failed to load background.", event.threadID);
      }

      const baseImage = await loadImage(bgBuffer);

      /* ================= AVATARS (LOCAL CACHE) ================= */
      const avatarPath1 = await getAvatarUrl(id1).catch(() => null);
      const avatarPath2 = await getAvatarUrl(id2).catch(() => null);

      const avatar1 = avatarPath1 && fs.existsSync(avatarPath1)
        ? await loadImage(avatarPath1)
        : await loadImage(path.join(__dirname, "assets/any.png"));

      const avatar2 = avatarPath2 && fs.existsSync(avatarPath2)
        ? await loadImage(avatarPath2)
        : await loadImage(path.join(__dirname, "assets/avatar.png"));

      /* ================= CANVAS ================= */
      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(avatar1, 111, 175, 330, 330);
      ctx.drawImage(avatar2, 1018, 173, 330, 330);

      /* ================= OUTPUT ================= */
      const outPath = path.join(__dirname, `prs_${Date.now()}.png`);
      fs.writeFileSync(outPath, canvas.toBuffer());

      return api.sendMessage(
        {
          body:
`『💗』Congratulations ${name1}
『❤️』Your destiny matched you with ${name2}
『🔗』Love compatibility: ${tile}%`,
          mentions: [
            { tag: name2, id: id2 },
            { tag: name1, id: id1 }
          ],
          attachment: fs.createReadStream(outPath)
        },
        event.threadID,
        () => {
          if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
        },
        event.messageID
      );

    } catch (err) {
      console.error("prs command error:", err);
      return api.sendMessage(
        "❌ PRS command failed.",
        event.threadID,
        event.messageID
      );
    }
  }
};
