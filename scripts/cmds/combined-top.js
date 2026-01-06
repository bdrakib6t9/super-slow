const utils = require("../../utils.js");

module.exports = {
  config: {
    name: "combined-top",
    aliases: ["allbal", "richtop", "totaltop"],
    version: "1.0",
    author: "Rakib",
    countDown: 5,
    role: 0,
    description: {
      en: "Top 10 users by wallet + bank combined balance",
      bn: "Wallet + Bank মিলিয়ে শীর্ষ ১০ ইউজার দেখাবে"
    },
    category: "economy"
  },

  langs: {
    en: {
      noData: "No user data found.",
      title: "💰 TOP 10 TOTAL WEALTH 💰"
    },
    bn: {
      noData: "এখনও কোনো ইউজারের ডাটা নেই।",
      title: "💰 TOP 10 মোট সম্পদ 💰"
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
       BUILD COMBINED LEADERBOARD
    ========================== */

    const leaderboard = [];

    for (const user of allUsers) {
      let walletRaw = user.money ?? "0";
      let bankRaw = user.data?.bank ?? "0";

      let wallet, bank;
      try {
        wallet = BigInt(walletRaw);
      } catch {
        wallet = 0n;
      }

      try {
        bank = BigInt(bankRaw);
      } catch {
        bank = 0n;
      }

      const total = wallet + bank;
      if (total <= 0n) continue;

      leaderboard.push({
        id: user.userID || user.id,
        name: user.name || user.data?.name || "Unknown User",
        wallet,
        bank,
        total
      });
    }

    if (leaderboard.length === 0)
      return message.reply(getLang("noData"));

    // 🔥 BigInt sort (REAL ranking)
    leaderboard.sort((a, b) =>
      a.total > b.total ? -1 : a.total < b.total ? 1 : 0
    );

    const top10 = leaderboard.slice(0, 10);
    const medals = ["🥇", "🥈", "🥉"];

    let msg = getLang("title") + "\n\n";

    top10.forEach((user, index) => {
      const rank = medals[index] || `#${index + 1}`;

      msg +=
        `${rank} ${user.name}\n` +
        `   💼 Wallet: ${utils.formatMoney(user.wallet)}\n` +
        `   🏦 Bank: ${utils.formatMoney(user.bank)}\n` +
        `   🔥 Total: ${utils.formatMoney(user.total)}\n\n`;
    });

    return message.reply(msg.trim());
  }
};
