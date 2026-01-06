module.exports = {
  config: {
    name: "blackjack-top",
    aliases: ["bjtop", "blackjacktop"],
    role: 0,
    category: "economy"
  },

  onStart: async function ({ message, usersData }) {

    let allUsers = [];
    if (typeof usersData.getAll === "function")
      allUsers = await usersData.getAll();
    else if (global.db?.allUserData)
      allUsers = global.db.allUserData;

    if (!allUsers.length)
      return message.reply("📭 No blackjack data found.");

    const board = [];

    for (const u of allUsers) {
      const stats = u.data?.bjStats;
      if (!stats) continue;

      board.push({
        name: u.name || "Unknown",
        win: stats.win || 0,
        lose: stats.lose || 0
      });
    }

    if (!board.length)
      return message.reply("📭 No blackjack data found.");

    board.sort((a, b) =>
      b.win - a.win || a.lose - b.lose
    );

    const top = board.slice(0, 10);
    const medal = ["🥇", "🥈", "🥉"];

    let msg = "🏆 BLACKJACK TOP PLAYERS 🏆\n\n";

    top.forEach((u, i) => {
      msg +=
        `${medal[i] || `#${i + 1}`} ${u.name}\n` +
        `   🏆 Wins: ${u.win} | 💀 Losses: ${u.lose}\n\n`;
    });

    return message.reply(msg.trim());
  }
};
