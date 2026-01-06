const utils = require("../../utils.js");

module.exports = {
  config: {
    name: "bank-top",
    aliases: ["banktop", "topbank"],
    version: "1.1",
    author: "Rakib",
    countDown: 5,
    role: 0,
    description: {
      en: "View top 10 users by bank balance",
      bn: "ব্যাংকে জমা রাখা টাকার শীর্ষ ১০ ইউজার দেখাবে"
    },
    category: "economy"
  },

  langs: {
    en: {
      noData: "No bank data found.",
      title: "🏦 TOP 10 BANK HOLDERS 🏦"
    },
    bn: {
      noData: "এখনও কোনো ব্যাংক ডাটা নেই।",
      title: "🏦 TOP 10 ব্যাংক লিডারবোর্ড 🏦"
    }
  },

  onStart: async function ({ message, usersData, getLang }) {
    let allUsers;

    // GoatBot v2
    if (typeof usersData.getAll === "function") {
      allUsers = await usersData.getAll();
    }
    // fallback
    else if (global.db && Array.isArray(global.db.allUserData)) {
      allUsers = global.db.allUserData;
    }
    else {
      return message.reply(getLang("noData"));
    }

    if (!allUsers || allUsers.length === 0)
      return message.reply(getLang("noData"));

    /* =========================
       BUILD BANK LEADERBOARD
    ========================== */

    const leaderboard = [];

    for (const user of allUsers) {
      const rawBank = user.data?.bank ?? "0";

      let bank;
      try {
        bank = BigInt(rawBank);
      } catch {
        bank = 0n;
      }

      if (bank <= 0n) continue;

      leaderboard.push({
        id: user.userID || user.id,
        name: user.name || user.data?.name || "Unknown User",
        bank
      });
    }

    if (leaderboard.length === 0)
      return message.reply(getLang("noData"));

    // 🔥 BigInt sort (accurate ranking)
    leaderboard.sort((a, b) =>
      a.bank > b.bank ? -1 : a.bank < b.bank ? 1 : 0
    );

    const top10 = leaderboard.slice(0, 10);
    const medals = ["🥇", "🥈", "🥉"];

    let msg = getLang("title") + "\n\n";

    top10.forEach((user, index) => {
      const rank = medals[index] || `#${index + 1}`;
      msg += `${rank} ${user.name} → ${utils.formatMoney(user.bank)}\n`;
    });

    return message.reply(msg.trim());
  }
};
