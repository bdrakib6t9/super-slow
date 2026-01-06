module.exports = {
  config: {
    name: "qzmy",
    version: "1.0",
    author: "Rakib",
    role: 0,
    category: "game"
  },

  onStart: async function ({ message, event, usersData }) {
    const user = await usersData.get(event.senderID);
    if (!user || !user.data) {
      return message.reply("❌ তুমি এখনো quiz খেলোনি!");
    }

    const d = user.data;
    const total = (d.quizWin || 0) + (d.quizLoss || 0);
    const rate = total ? ((d.quizWin / total) * 100).toFixed(1) : "0.0";

    message.reply(
`👤 তোমার Quiz Profile

🏆 Win: ${d.quizWin || 0}
❌ Loss: ${d.quizLoss || 0}
🎯 Total: ${total}

🔥 Current Streak: ${d.quizStreak || 0}
🏅 Best Streak: ${d.quizBestStreak || 0}

🏅 Badges:
${d.quizBadges?.length ? d.quizBadges.join(" | ") : "No badge yet"}

📈 Win Rate: ${rate}%`
    );
  }
};
