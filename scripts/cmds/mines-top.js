const utils = require("../../utils.js");

module.exports = {
  config: {
    name: "mines-top",
    aliases: ["minestop"],
    version: "1.0",
    author: "Rakib",
    role: 0,
    category: "economy",
    description: {
      en: "Top Mines game winners",
      bn: "মাইনস গেম লিডারবোর্ড"
    }
  },

  onStart: async function ({ message, usersData }) {

    let allUsers = [];

    if (typeof usersData.getAll === "function")
      allUsers = await usersData.getAll();
    else if (global.db?.allUserData)
      allUsers = global.db.allUserData;

    if (!allUsers.length)
      return message.reply("📭 No mines data found.");

    const leaderboard = [];

    for (const user of allUsers) {
      const stats = user.data?.minesStats;
      if (!stats) continue;

      let win = 0n;
      let lose = 0n;

      try {
        win = BigInt(stats.win || 0);
        lose = BigInt(stats.lose || 0);
      } catch { }

      const net = win - lose;
      if (net <= 0n) continue;

      leaderboard.push({
        name: user.name || "Unknown",
        net
      });
    }

    if (!leaderboard.length)
      return message.reply("📭 No mines data found.");

    leaderboard.sort((a, b) =>
      a.net > b.net ? -1 : a.net < b.net ? 1 : 0
    );

    const top = leaderboard.slice(0, 10);
    const medals = ["🥇", "🥈", "🥉"];

    let msg = "🏆 MINES TOP PLAYERS 🏆\n\n";

    top.forEach((u, i) => {
      msg +=
        `${medals[i] || `#${i + 1}`} ${u.name}\n` +
        `   💰 Profit: ${utils.formatMoney(u.net)}\n\n`;
    });

    return message.reply(msg.trim());
  }
};
