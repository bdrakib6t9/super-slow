const utils = require("../../utils.js");

module.exports = {
  config: {
    name: "slot-top",
    aliases: ["slottop"],
    version: "1.1",
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
      return message.reply("📭 No slot data found.");
    }

    const leaderboard = [];

    for (const user of allUsers) {
      const data = user.data || {};
      let win;

      try {
        win = BigInt(data.slotWin || 0);
      } catch {
        win = 0n;
      }

      if (win <= 0n) continue;

      leaderboard.push({
        name: user.name || "Unknown",
        win
      });
    }

    if (leaderboard.length === 0)
      return message.reply("📭 No slot data found.");

    leaderboard.sort((a, b) =>
      a.win > b.win ? -1 : 1
    );

    const medals = ["🥇", "🥈", "🥉"];
    let msg = "🎰 TOP 10 SLOT WINNERS 🎰\n\n";

    leaderboard.slice(0, 10).forEach((u, i) => {
      msg += `${medals[i] || `#${i+1}`} ${u.name} → ${utils.formatMoney(u.win)}\n`;
    });

    return message.reply(msg.trim());
  }
};
