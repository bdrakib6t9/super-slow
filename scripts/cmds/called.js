module.exports = {
  config: {
    name: "called",
    aliases: ["msgs", "count"],
    version: "2.0",
    author: "Rakib",
    role: 0,
    countDown: 5,
    category: "utility",
    description: "Show message count (personal & group leaderboard)"
  },

  langs: {
    en: {
      your: "💬 You have sent %1 messages in this group.",
      yourGlobal: "🌍 Total messages sent: %1",
      top: "🏆 Top %1 message senders in this group:",
      row: "%1. %2 — %3 messages",
      noData: "No message data yet.",
      resetDone: "✅ Group message counts reset.",
      notAllowed: "🚫 You are not allowed to do this."
    },
    bn: {
      your: "💬 এই গ্রুপে তুমি %1টি মেসেজ পাঠিয়েছো।",
      yourGlobal: "🌍 মোট পাঠানো মেসেজ: %1",
      top: "🏆 এই গ্রুপের শীর্ষ %1 জন মেসেজার:",
      row: "%1. %2 — %3 বার",
      noData: "এখনও কোনো ডেটা নেই।",
      resetDone: "✅ গ্রুপের মেসেজ কাউন্ট রিসেট করা হয়েছে।",
      notAllowed: "🚫 তোমার অনুমতি নেই।"
    }
  },

  onStart: async function ({ message, event, usersData, threadsData, getLang, args }) {
    const uid = event.senderID;
    const tid = event.threadID;
    const sub = args[0];

    // ===== LOAD DATA =====
    const user = (await usersData.get(uid)) || {};
    const thread = (await threadsData.get(tid)) || {};
    const map = thread.data?.messageCounter || {};

    // ===== ME =====
    if (!sub || sub === "me") {
      const groupCount = map[uid] || 0;
      const globalCount = user.messageCount || 0;

      return message.reply(
        getLang("your", groupCount) + "\n" +
        getLang("yourGlobal", globalCount)
      );
    }

    // ===== TOP =====
    if (sub === "top") {
      const entries = Object.entries(map);
      if (!entries.length) return message.reply(getLang("noData"));

      entries.sort((a, b) => b[1] - a[1]);
      const top = entries.slice(0, 10);

      let text = getLang("top", top.length) + "\n";
      for (let i = 0; i < top.length; i++) {
        const u = await usersData.get(top[i][0]) || {};
        text += getLang(
          "row",
          i + 1,
          u.name || `User ${top[i][0]}`,
          top[i][1]
        ) + "\n";
      }
      return message.reply(text);
    }

    // ===== RESET (ADMIN) =====
    if (sub === "reset") {
      const isAdmin = event.isAdmin || event.senderRole >= 2;
      if (!isAdmin) return message.reply(getLang("notAllowed"));

      if (thread.data?.messageCounter) {
        thread.data.messageCounter = {};
        await threadsData.set(tid, thread);
      }

      return message.reply(getLang("resetDone"));
    }
  }
};
