const utils = require("../../utils.js");

module.exports = {
  config: {
    name: "crash-top",
    aliases: ["crashtop", "rocket-top"],
    version: "1.1",
    author: "Rakib",
    role: 0,
    category: "economy",
    description: {
      en: "Top 10 Crash game winners",
      bn: "ক্র্যাশ গেমের শীর্ষ ১০ বিজয়ী"
    }
  },

  onStart: async function ({ message, usersData }) {
    let allUsers = [];

    // GoatBot v2
    if (typeof usersData.getAll === "function") {
      allUsers = await usersData.getAll();
    }
    // fallback
    else if (global.db && Array.isArray(global.db.allUserData)) {
      allUsers = global.db.allUserData;
    }

    if (!allUsers.length)
      return message.reply("📭 No crash data found.");

    const leaderboard = [];

    for (const user of allUsers) {
      const stats = user.data?.crashStats;
      if (!stats) continue;

      let win = 0n;
      let lose = 0n;

      try {
        win = BigInt(stats.win || 0);
        lose = BigInt(stats.lose || 0);
      } catch {
        continue;
      }

      const net = win - lose;
      if (net <= 0n) continue;

      leaderboard.push({
        name: user.name || "Unknown",
        net
      });
    }

    if (!leaderboard.length)
      return message.reply("📭 No crash data found.");

    // BigInt-safe sort
    leaderboard.sort((a, b) =>
      a.net > b.net ? -1 : a.net < b.net ? 1 : 0
    );

    const top10 = leaderboard.slice(0, 10);
    const medals = ["🥇", "🥈", "🥉"];

    let msg = "🏆 CRASH TOP PLAYERS 🏆\n\n";

    top10.forEach((u, i) => {
      msg +=
        `${medals[i] || `#${i + 1}`} ${u.name}\n` +
        `   💰 Net Profit: ${utils.formatMoney(u.net)}\n\n`;
    });

    return message.reply(msg.trim());
  }
};
