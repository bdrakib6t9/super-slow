const utils = require("../../utils.js");

module.exports = {
  config: {
    name: "dice-top",
    aliases: ["dicetop"],
    version: "2.0",
    author: "Rakib",
    role: 0,
    category: "economy"
  },

  onStart: async function ({ message, usersData }) {
    let allUsers;

    if (typeof usersData.getAll === "function") {
      allUsers = await usersData.getAll();
    }
    else if (global.db && Array.isArray(global.db.allUserData)) {
      allUsers = global.db.allUserData;
    }
    else {
      return message.reply("❌ No data found.");
    }

    const leaderboard = [];

    for (const user of allUsers) {
      const data = user.data || {};

      // 🔥 must have played dice at least once
      if (!data.dicePlayed || data.dicePlayed <= 0) continue;

      let win;
      try {
        win = BigInt(data.diceWin || 0);
      } catch {
        win = 0n;
      }

      leaderboard.push({
        name: user.name || "Unknown",
        win
      });
    }

    if (leaderboard.length === 0)
      return message.reply("❌ No dice history found.");

    // 🔥 rank by total win
    leaderboard.sort((a, b) =>
      a.win > b.win ? -1 : a.win < b.win ? 1 : 0
    );

    const medals = ["🥇", "🥈", "🥉"];
    let msg = "🏆 TOP 10 DICE PLAYERS 🏆\n\n";

    leaderboard.slice(0, 10).forEach((u, i) => {
      msg += `${medals[i] || `#${i + 1}`} ${u.name} → ${utils.formatMoney(u.win)}\n`;
    });

    return message.reply(msg.trim());
  }
};
