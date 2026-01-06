module.exports = {
  config: {
    name: "quiztop",
    aliases: ["qztop"],
    version: "1.0",
    author: "Rakib",
    role: 0,
    category: "game",
    guide: {
      en: "quiztop → show top quiz players"
    }
  },

  onStart: async function ({ message, usersData }) {
    try {
      const allUsers = await usersData.getAll();

      // leaderboard prepare
      const leaderboard = allUsers
        .map(user => {
          const data = user.data || {};
          return {
            name: user.name || "Unknown",
            win: data.quizWin || 0,
            loss: data.quizLoss || 0,
            bestStreak: data.quizBestStreak || 0
          };
        })
        .filter(u => u.win > 0 || u.loss > 0) // only quiz players
        .sort((a, b) => {
          // 🔥 priority: win > best streak > low loss
          if (b.win !== a.win) return b.win - a.win;
          if (b.bestStreak !== a.bestStreak) return b.bestStreak - a.bestStreak;
          return a.loss - b.loss;
        })
        .slice(0, 10);

      if (!leaderboard.length) {
        return message.reply("❌ এখনো কোনো Quiz data নেই!");
      }

      let text = "🏆 Quiz Leaderboard (Top 10)\n\n";

      leaderboard.forEach((u, i) => {
        text +=
`${i + 1}. ${u.name}
   🏆 Win: ${u.win}
   ❌ Loss: ${u.loss}
   🔥 Best Streak: ${u.bestStreak}\n\n`;
      });

      message.reply(text.trim());

    } catch (err) {
      console.error("quiztop error:", err);
      message.reply("❌ Leaderboard লোড করা যাচ্ছে না!");
    }
  }
};
