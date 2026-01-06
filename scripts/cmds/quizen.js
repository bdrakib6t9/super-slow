const axios = require("axios");

// 🔒 one active quiz per user (English)
const ACTIVE_QUIZ_EN = new Map();

module.exports = {
  config: {
    name: "quizen",
    aliases: ["qzen"],
    version: "FINAL-EDIT-EN",
    author: "Rakib",
    role: 0,
    category: "game",
    guide: {
      en: "quizen → get English quiz\nReply A / B / C / D"
    }
  },

  // ================= START =================
  onStart: async function ({ message, event, api, usersData }) {
    const uid = event.senderID;

    if (ACTIVE_QUIZ_EN.has(uid)) {
      return message.reply("⚠️ You already have an active English quiz!");
    }

    try {
      const user = await usersData.get(uid) || {};
      const token = user.data?.quizTokenEN || "";

      const res = await axios.get(
        `https://rakib-api.vercel.app/api/quiz?category=English&apikey=rakib69&token=${token}`
      );

      const q = res.data;
      const answer = String(q.answer || "").trim().toUpperCase();

      if (!["A", "B", "C", "D"].includes(answer)) {
        return message.reply("❌ Quiz data invalid!");
      }

      const quizText =
`🧠 English Quiz

❓ Question:
${q.question}

🅰 ${q.A}
🅱 ${q.B}
🅲 ${q.C}
🅳 ${q.D}

✍️ Reply with:
A / B / C / D`;

      const info = await message.reply(quizText);

      const timer = setTimeout(() => {
        ACTIVE_QUIZ_EN.delete(uid);
        try {
          api.editMessage(
`⌛ Time's up!

❓ Question:
${q.question}

✅ Correct Answer:
${answer}) ${q[answer]}`,
            info.messageID
          );
        } catch {}
      }, 40000);

      ACTIVE_QUIZ_EN.set(uid, true);

      global.GoatBot.onReply.set(info.messageID, {
        commandName: this.config.name,
        author: uid,
        answer,
        token: q.token,
        options: { A: q.A, B: q.B, C: q.C, D: q.D },
        quizMessageID: info.messageID,
        timer,
        question: q.question
      });

    } catch (err) {
      ACTIVE_QUIZ_EN.delete(uid);
      console.error(err);
      message.reply("❌ Failed to load English quiz!");
    }
  },

  // ================= REPLY =================
  onReply: async function ({ event, usersData, Reply, api }) {
    const uid = event.senderID;
    const ans = (event.body || "").trim().toUpperCase();

    if (!["A", "B", "C", "D"].includes(ans)) return;
    if (uid !== Reply.author) return;

    clearTimeout(Reply.timer);
    ACTIVE_QUIZ_EN.delete(uid);
    global.GoatBot.onReply.delete(Reply.quizMessageID);

    const correct = Reply.answer;
    const correctText = Reply.options[correct];

    const user = await usersData.get(uid) || {};
    const data = user.data || {};

    let win = data.quizWinEN || 0;
    let loss = data.quizLossEN || 0;
    let streak = data.quizStreakEN || 0;
    let bestStreak = data.quizBestStreakEN || 0;
    let badges = data.quizBadgesEN || [];
    const newBadges = [];

    // ===== CORRECT =====
    if (ans === correct) {
      win++;
      streak++;
      bestStreak = Math.max(bestStreak, streak);

      if (win >= 5 && !badges.includes("🥉 Bronze EN")) newBadges.push("🥉 Bronze EN");
      if (win >= 10 && !badges.includes("🥈 Silver EN")) newBadges.push("🥈 Silver EN");
      if (win >= 25 && !badges.includes("🥇 Gold EN")) newBadges.push("🥇 Gold EN");
      if (win >= 50 && !badges.includes("🏆 Champion EN")) newBadges.push("🏆 Champion EN");
      if (bestStreak >= 10 && !badges.includes("🔥 Streak Master EN")) newBadges.push("🔥 Streak Master EN");

      badges = [...new Set([...badges, ...newBadges])];

      if (typeof usersData.addMoney === "function") {
        await usersData.addMoney(uid, 500);
      }

      await usersData.set(uid, {
        exp: (user.exp || 0) + 100,
        data: {
          ...data,
          quizWinEN: win,
          quizLossEN: loss,
          quizStreakEN: streak,
          quizBestStreakEN: bestStreak,
          quizBadgesEN: badges,
          quizTokenEN: Reply.token
        }
      });

      const editText =
`🎉 Correct Answer!

❓ ${Reply.question}

✅ ${correct}) ${correctText}

🏆 Win: ${win}
❌ Loss: ${loss}
🔥 Streak: ${streak}
🏅 Best Streak: ${bestStreak}
${newBadges.length ? `\n🏅 New Badge:\n${newBadges.join(" | ")}` : ""}`;

      return api.editMessage(editText, Reply.quizMessageID);
    }

    // ===== WRONG =====
    loss++;
    streak = 0;

    await usersData.set(uid, {
      data: {
        ...data,
        quizWinEN: win,
        quizLossEN: loss,
        quizStreakEN: 0,
        quizBestStreakEN: bestStreak,
        quizBadgesEN: badges,
        quizTokenEN: Reply.token
      }
    });

    const wrongText =
`❌ Wrong Answer!

❓ ${Reply.question}

✅ Correct Answer:
${correct}) ${correctText}

🏆 Win: ${win}
❌ Loss: ${loss}
🔥 Streak reset`;

    return api.editMessage(wrongText, Reply.quizMessageID);
  }
};
