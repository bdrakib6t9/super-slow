module.exports = {
  config: {
    name: "exptop",
    aliases: ["xptop", "expleaderboard"],
    version: "2.0",
    author: "Rakib",
    countDown: 5,
    role: 0,
    description: {
      vi: "xem top 10 người có nhiều EXP nhất",
      en: "view top 10 users with highest EXP",
      bn: "শীর্ষ ১০ EXP লিডারবোর্ড দেখাবে"
    },
    category: "economy"
  },

  langs: {
    vi: {
      noData: "Chưa có dữ liệu EXP.",
      title: "🏆 TOP 10 EXP 🏆"
    },
    en: {
      noData: "No EXP data found.",
      title: "🏆 TOP 10 EXP LEADERBOARD 🏆"
    },
    bn: {
      noData: "এখনো কোনো EXP ডাটা নেই।",
      title: "🏆 TOP 10 EXP লিডারবোর্ড 🏆"
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

    const leaderboard = [];

    for (const user of allUsers) {
      const exp =
        typeof user.exp === "number"
          ? user.exp
          : (typeof user.data?.exp === "number" ? user.data.exp : 0);

      if (exp <= 0) continue;

      leaderboard.push({
        id: user.userID || user.id,
        name: user.name || user.data?.name || "Unknown User",
        exp
      });
    }

    if (leaderboard.length === 0)
      return message.reply(getLang("noData"));

    // 🔥 SORT BY EXP
    leaderboard.sort((a, b) => b.exp - a.exp);

    const top10 = leaderboard.slice(0, 10);

    let msg = getLang("title") + "\n\n";
    const medals = ["🥇", "🥈", "🥉"];

    top10.forEach((user, index) => {
      const rank = medals[index] || `#${index + 1}`;
      msg += `${rank} ${user.name} → ${user.exp} EXP\n`;
    });

    return message.reply(msg.trim());
  }
};
