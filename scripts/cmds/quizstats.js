module.exports = {
  config: {
    name: "quizstats",
    aliases: ["qzlb"],
    version: "1.0",
    author: "Rakib",
    role: 0,
    category: "game"
  },

  onStart: async function ({ message, usersData }) {
    const all = await usersData.getAll();

    const top = all
      .map(u => ({
        name: u.name || "Unknown",
        win: u.data?.quizWin || 0,
        loss: u.data?.quizLoss || 0,
        best: u.data?.quizBestStreak || 0
      }))
      .filter(u => u.win + u.loss > 0)
      .sort((a, b) => b.win - a.win || b.best - a.best || a.loss - b.loss)
      .slice(0, 10);

    if (!top.length) return message.reply("❌ কোনো leaderboard নেই!");

    let text = "🏆 Quiz Top 10\n\n";
    top.forEach((u, i) => {
      const rate = ((u.win / (u.win + u.loss)) * 100).toFixed(1);
      text += `${i+1}. ${u.name}\n🏆 ${u.win} ❌ ${u.loss} 🔥 ${u.best} | ${rate}%\n\n`;
    });

    message.reply(text.trim());
  }
};
