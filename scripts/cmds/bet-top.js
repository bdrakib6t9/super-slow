const utils = require("../../utils.js");

module.exports = {
  config: {
    name: "bet-top",
    aliases: ["bettop", "betlb"],
    version: "1.0",
    author: "Rakib",
    role: 0,
    category: "economy",
    description: {
      en: "Top 10 players based on betting performance",
      bn: "বেট গেমে শীর্ষ ১০ খেলোয়াড়"
    }
  },

  langs: {
    en: {
      noData: "📭 No bet history found.",
      title: "🏆 TOP 10 BET PLAYERS 🏆"
    }
  },

  onStart: async function ({ message, usersData, getLang }) {

    // ===== LOAD ALL USERS =====
    let allUsers = [];
    if (typeof usersData.getAll === "function") {
      allUsers = await usersData.getAll();
    }
    else if (global.db && Array.isArray(global.db.allUserData)) {
      allUsers = global.db.allUserData;
    }

    if (!allUsers.length)
      return message.reply(getLang("noData"));

    /* =========================
       BUILD LEADERBOARD
    ========================== */

    const leaderboard = [];

    for (const user of allUsers) {
      const data = user.data || {};
      const history = data.betHistory || [];

      if (!history.length) continue;

      let wins = 0;
      let losses = 0;
      let profit = 0n;

      for (const h of history) {
        if (h.result.includes("WIN")) {
          wins++;
          profit += BigInt(h.amount);
        }
        else {
          losses++;
          profit -= BigInt(h.amount);
        }
      }

      leaderboard.push({
        name: user.name || "Unknown",
        wins,
        losses,
        games: wins + losses,
        profit
      });
    }

    if (!leaderboard.length)
      return message.reply(getLang("noData"));

    // 🔥 SORT BY PROFIT (BigInt SAFE)
    leaderboard.sort((a, b) =>
      a.profit > b.profit ? -1 : a.profit < b.profit ? 1 : 0
    );

    const top10 = leaderboard.slice(0, 10);

    /* =========================
       BUILD MESSAGE
    ========================== */

    let msg = getLang("title") + "\n\n";
    const medals = ["🥇", "🥈", "🥉"];

    top10.forEach((u, i) => {
      const rank = medals[i] || `#${i + 1}`;

      msg +=
        `${rank} ${u.name}\n` +
        `   🎮 Games: ${u.games}\n` +
        `   🏆 Wins: ${u.wins} | 💀 Losses: ${u.losses}\n` +
        `   💰 Profit: ${utils.formatMoney(u.profit)}\n\n`;
    });

    return message.reply(msg.trim());
  }
};
