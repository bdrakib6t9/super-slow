const axios = require("axios");

// 🔒 one active quiz per user
const ACTIVE_QUIZ = new Map();

module.exports = {
  config: {
    name: "quiz",
    aliases: ["qz"],
    version: "FINAL-EDIT",
    author: "Rakib",
    role: 0,
    category: "game",
    guide: {
      en: "quiz → get quiz\nReply A / B / C / D"
    }
  },

  // ================= START =================
  onStart: async function ({ message, event, api, usersData }) {
    const uid = event.senderID;

    if (ACTIVE_QUIZ.has(uid)) {
      return message.reply("⚠️ তুমি ইতিমধ্যে একটি Quiz খেলছো!");
    }

    try {
      const user = await usersData.get(uid) || {};
      const token = user.data?.quizToken || "";

      const res = await axios.get(
        `https://rakib-api.vercel.app/api/quiz?category=Bangla&apikey=rakib69&token=${token}`
      );

      const q = res.data;
      const answer = String(q.answer || "").trim().toUpperCase();

      if (!["A", "B", "C", "D"].includes(answer)) {
        return message.reply("❌ Quiz data invalid!");
      }

      const quizText =
`🧠 বাংলা Quiz

❓ প্রশ্ন:
${q.question}

🅰 ${q.A}
🅱 ${q.B}
🅲 ${q.C}
🅳 ${q.D}

✍️ রিপ্লাই করো:
A / B / C / D`;

      const info = await message.reply(quizText);

      const timer = setTimeout(() => {
        ACTIVE_QUIZ.delete(uid);
        try {
          api.editMessage(
`⌛ সময় শেষ!

❓ প্রশ্ন:
${q.question}

✅ সঠিক উত্তর: ${answer}) ${q[answer]}`,
            info.messageID
          );
        } catch {}
      }, 40000);

      ACTIVE_QUIZ.set(uid, true);

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

    } catch (e) {
      ACTIVE_QUIZ.delete(uid);
      message.reply("❌ Quiz লোড করা যাচ্ছে না!");
    }
  },

  // ================= REPLY =================
  onReply: async function ({ message, event, usersData, Reply, api }) {
    const uid = event.senderID;
    const ans = (event.body || "").trim().toUpperCase();

    if (!["A", "B", "C", "D"].includes(ans)) return;
    if (uid !== Reply.author) return;

    clearTimeout(Reply.timer);
    ACTIVE_QUIZ.delete(uid);
    global.GoatBot.onReply.delete(Reply.quizMessageID);

    const correct = Reply.answer;
    const correctText = Reply.options[correct];

    const user = await usersData.get(uid) || {};
    const data = user.data || {};

    let win = data.quizWin || 0;
    let loss = data.quizLoss || 0;
    let streak = data.quizStreak || 0;
    let bestStreak = data.quizBestStreak || 0;
    let badges = data.quizBadges || [];
    const newBadges = [];

    // ===== CORRECT =====
    if (ans === correct) {
      win++;
      streak++;
      bestStreak = Math.max(bestStreak, streak);

      if (win >= 5 && !badges.includes("🥉 Bronze")) newBadges.push("🥉 Bronze");
      if (win >= 10 && !badges.includes("🥈 Silver")) newBadges.push("🥈 Silver");
      if (win >= 25 && !badges.includes("🥇 Gold")) newBadges.push("🥇 Gold");
      if (win >= 50 && !badges.includes("🏆 Champion")) newBadges.push("🏆 Champion");
      if (bestStreak >= 10 && !badges.includes("🔥 Streak Master")) newBadges.push("🔥 Streak Master");

      badges = [...new Set([...badges, ...newBadges])];

      if (typeof usersData.addMoney === "function") {
        await usersData.addMoney(uid, 500);
      }

      await usersData.set(uid, {
        exp: (user.exp || 0) + 100,
        data: {
          ...data,
          quizWin: win,
          quizLoss: loss,
          quizStreak: streak,
          quizBestStreak: bestStreak,
          quizBadges: badges,
          quizToken: Reply.token
        }
      });

      const editText =
`🎉 সঠিক উত্তর!

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
        quizWin: win,
        quizLoss: loss,
        quizStreak: 0,
        quizBadges: badges,
        quizToken: Reply.token
      }
    });

    const wrongText =
`❌ ভুল উত্তর!

❓ ${Reply.question}

✅ সঠিক উত্তর:
${correct}) ${correctText}

🏆 Win: ${win}
❌ Loss: ${loss}
🔥 Streak reset`;

    return api.editMessage(wrongText, Reply.quizMessageID);
  }
};
