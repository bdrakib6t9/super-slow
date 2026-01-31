module.exports = {
  config: {
    name: "spamreport",
    aliases: ["spamtop", "spamcheck", "spm"],
    version: "1.1",
    author: "Rakib",
    role: 2,
    shortDescription: "Show top spam statistics",
    category: "system",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ message }) {
    const data = global.__spamCache;
    if (!data)
      return message.reply("❌ Spam data not initialized yet.");

    // resolve user name
    const getUserName = (uid) => {
      const u = global.db.allUserData.find(x => x.userID == uid);
      return u?.name || "Unknown User";
    };

    // resolve group name
    const getGroupName = (tid) => {
      const t = global.db.allThreadData.find(x => x.threadID == tid);
      return t?.threadName || "Unknown Group";
    };

    const top = (obj, limit = 3, resolver = null) => {
      if (!obj || Object.keys(obj).length === 0)
        return "No data";

      return Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id, count], i) => {
          const name = resolver ? resolver(id) : "";
          return resolver
            ? `${i + 1}. ${name} (${id}) → ${count}`
            : `${i + 1}. ${id} → ${count}`;
        })
        .join("\n");
    };

    const msg =
`📊 𝗦𝗣𝗔𝗠 𝗦𝗧𝗔𝗧𝗜𝗦𝗧𝗜𝗖𝗦 (LIVE)

👤 Top 3 Users:
${top(data.users, 3, getUserName)}

⚙️ Top 3 Commands:
${top(data.commands)}

👥 Top 3 Groups:
${top(data.threads, 3, getGroupName)}
`;

    message.reply(msg);
  }
};
