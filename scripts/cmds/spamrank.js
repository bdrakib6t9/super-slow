module.exports = {
  config: {
    name: "spamrank",
    aliases: ["spmtp", "spamrank"],
    version: "1.0",
    author: "Rakib",
    role: 2,
    shortDescription: "Top spammers with top spammed commands",
    category: "system",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ message, usersData }) {
    const cache = global.__spamCache;

    if (!cache || !cache.users)
      return message.reply("❌ Spam data not ready yet.");

    // top 5 spammers
    const topUsers = Object.entries(cache.users)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (topUsers.length === 0)
      return message.reply("ℹ️ No spam data found.");

    // top 3 commands overall
    const topCommands = Object.entries(cache.commands || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cmd, count], i) => `${i + 1}. ${cmd} → ${count}`)
      .join("\n") || "No command data";

    let text = "🔥 𝗧𝗢𝗣 𝟱 𝗦𝗣𝗔𝗠𝗠𝗘𝗥𝗦\n\n";

    let i = 1;
    for (const [uid, count] of topUsers) {
      let name = "Unknown User";
      try {
        const user = await usersData.get(uid);
        if (user?.name) name = user.name;
      } catch {}

      text +=
`${i}. 👤 ${name}
🆔 ${uid}
📨 Total Spam → ${count}

⚙️ Top Commands:
${topCommands}

──────────────────────
`;
      i++;
    }

    message.reply(text.trim());
  }
};
