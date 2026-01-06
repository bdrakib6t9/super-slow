const utils = require("../../utils.js");

module.exports = {
  config: {
    name: "balance-top",
    aliases: ["baltop", "leaderboard", "rich"],
    version: "3.1",
    author: "Rakib",
    countDown: 5,
    role: 0,
    description: {
      vi: "xem top 10 người có nhiều tiền nhất",
      en: "view top 10 richest users",
      bn: "শীর্ষ ১০ ধনী ইউজার দেখাবে"
    },
    category: "economy"
  },

  langs: {
    vi: {
      noData: "Chưa có dữ liệu người dùng.",
      title: "🏆 TOP 10 NGƯỜI GIÀU NHẤT 🏆"
    },
    en: {
      noData: "No user data found.",
      title: "🏆 TOP 10 RICHEST USERS 🏆"
    },
    bn: {
      noData: "এখনও কোনো ইউজারের ডাটা নেই।",
      title: "🏆 TOP 10 লিডারবোর্ড 🏆"
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
       BUILD LEADERBOARD
    ========================== */

    const leaderboard = [];

    for (const user of allUsers) {
      const rawMoney =
        user.money ??
        user.data?.money ??
        "0";

      let money;
      try {
        money = BigInt(rawMoney);
      } catch {
        money = 0n;
      }

      if (money <= 0n) continue;

      leaderboard.push({
        id: user.userID || user.id,
        name: user.name || user.data?.name || "Unknown User",
        money
      });
    }

    if (leaderboard.length === 0)
      return message.reply(getLang("noData"));

    // 🔥 BigInt sort (REAL ranking)
    leaderboard.sort((a, b) =>
      a.money > b.money ? -1 : a.money < b.money ? 1 : 0
    );

    const top10 = leaderboard.slice(0, 10);
    const medals = ["🥇", "🥈", "🥉"];

    let msg = getLang("title") + "\n\n";

    top10.forEach((user, index) => {
      const rank = medals[index] || `#${index + 1}`;
      msg += `${rank} ${user.name} → ${utils.formatMoney(user.money)}\n`;
    });

    return message.reply(msg.trim());
  }
};
