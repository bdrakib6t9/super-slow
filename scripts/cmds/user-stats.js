const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const utils = require("../../utils.js");

/* ================= HELPERS ================= */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getNeonBlue() {
  const colors = ["#00bfff", "#1e90ff", "#00ffff", "#4facfe"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function expToLevel(exp, deltaNext = 5) {
  return Math.floor((1 + Math.sqrt(1 + 8 * exp / deltaNext)) / 2);
}

/* ================= COMMAND ================= */
module.exports = {
  config: {
    name: "user-stats",
    aliases: ["uses", "userstats"],
    version: "7.1",
    author: "Rakib",
    countDown: 5,
    shortDescription: { en: "Show user info card" },
    longDescription: { en: "Stats card with real username + rank" },
    category: "info"
  },

  onStart: async function ({ event, message, usersData, api, threadsData }) {

    /* ========= TARGET USERS ========= */
    let targetIDs = [];

    if (event.type === "message_reply") {
      targetIDs = [String(event.messageReply.senderID)];
    } else if (Object.keys(event.mentions).length > 0) {
      targetIDs = Object.keys(event.mentions);
    } else {
      targetIDs = [String(event.senderID)];
    }

    const attachments = [];

    for (const uid of targetIDs) {
      const user = await usersData.get(uid);
      if (!user) continue;

      /* ================= AVATAR ================= */
      let avatar;
      try {
        const avatarUrl = await usersData.getAvatarUrl(uid);
        const res = await axios.get(avatarUrl, {
          responseType: "arraybuffer",
          timeout: 15000
        });
        avatar = await loadImage(res.data);
      } catch {
        avatar = await loadImage(path.join(__dirname, "default_avatar.png"));
      }

      /* ================= USERNAME ================= */
      let username =
        user.username ||
        user.vanity ||
        user.name ||
        "Unknown";

      try {
        const info = await api.getUserInfo(uid);
        if (info && info[uid]) {
          username =
            info[uid].vanity ||
            info[uid].username ||
            username;
        }
      } catch {}

      if (!username.startsWith("@")) {
        username = "@" + username.replace(/\s+/g, "");
      }

      /* ================= RANK ================= */
      const allUser = await usersData.getAll();
      allUser.sort((a, b) => (b.exp || 0) - (a.exp || 0));
      const rank =
        allUser.findIndex(u => String(u.userID) === uid) + 1;

      const genderText =
        user.gender === 1 ? "Female" :
        user.gender === 2 ? "Male" : "Unknown";

      const exp = Number(user.exp || 0);
      const level = expToLevel(exp);

      let wallet = 0n;
      let bank = 0n;
      try { wallet = BigInt(user.money ?? 0); } catch {}
      try { bank = BigInt(user.data?.bank ?? 0); } catch {}

      const totalBalance = wallet + bank;

      const threadData = await threadsData.get(event.threadID);
      const member = threadData?.members?.find(m => String(m.userID) === uid);
      const messages = member?.count || 0;

      /* ================= CANVAS ================= */
      const canvas = createCanvas(1600, 1400);
      const ctx = canvas.getContext("2d");

      /* ================= BACKGROUND (WITH FALLBACK) ================= */
      let bg;
      try {
        bg = await loadImage("https://i.imgur.com/Vc6j5ts.jpeg");
      } catch (e) {
        bg = await loadImage(
          "https://raw.githubusercontent.com/bdrakib123/rakib-goat-bot/main/scripts/cmds/cache/MuchaTseBle.jpeg"
        );
      }

      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(5, 15, 35, 0.78)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const neon = getNeonBlue();

      ctx.strokeStyle = neon;
      ctx.lineWidth = 14;
      ctx.shadowColor = neon;
      ctx.shadowBlur = 35;
      ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
      ctx.shadowBlur = 0;

      /* ================= AVATAR ================= */
      ctx.save();
      ctx.beginPath();
      ctx.arc(800, 220, 160, 0, Math.PI * 2);
      ctx.strokeStyle = neon;
      ctx.lineWidth = 10;
      ctx.shadowBlur = 45;
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(800, 220, 150, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatar, 650, 70, 300, 300);
      ctx.restore();

      /* ================= NAME ================= */
      ctx.font = "bold 80px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.shadowColor = neon;
      ctx.shadowBlur = 30;
      ctx.fillText(user.name || "Unknown", 800, 470);
      ctx.shadowBlur = 0;

      /* ================= INFO ================= */
      ctx.font = "bold 46px Arial";
      ctx.textAlign = "left";
      ctx.fillStyle = "#eaf4ff";

      const infoLines = [
        `🌐 Username: ${username}`,
        `🏆 Rank: #${rank}`,
        `⭐ Level: ${level}`,
        `⚡ EXP: ${formatNumber(exp)}`,
        `🆔 UID: ${uid}`,
        `👤 Gender: ${genderText}`,
        `💼 Wallet: ${utils.formatMoney(wallet)}`,
        `🏦 Bank: ${utils.formatMoney(bank)}`,
        `💰 Total: ${utils.formatMoney(totalBalance)}`,
        `💬 Messages: ${formatNumber(messages)}`,
        `🕒 Updated: ${moment().format("YYYY-MM-DD HH:mm:ss")}`
      ];

      let y = 560;
      for (const line of infoLines) {
        ctx.fillText(line, 260, y);
        y += 70;
      }

      /* ================= SAVE ================= */
      const tmp = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmp)) fs.mkdirSync(tmp);

      const filePath = path.join(tmp, `${uid}_stats.png`);
      fs.writeFileSync(filePath, canvas.toBuffer());

      attachments.push(fs.createReadStream(filePath));
    }

    if (!attachments.length) {
      return message.reply("❌ No user data found.");
    }

    message.reply(
      {
        body: "🕵️ User Profile Card",
        attachment: attachments
      },
      () => {
        const tmp = path.join(__dirname, "tmp");
        fs.readdirSync(tmp).forEach(f =>
          fs.unlinkSync(path.join(tmp, f))
        );
      }
    );
  }
};
