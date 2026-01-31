module.exports = {
  config: {
    name: "spamgc",
    aliases: ["spamgroup", "gctop"],
    version: "1.0",
    author: "Rakib",
    role: 2,
    shortDescription: "Show top spam groups",
    category: "system",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ message, threadsData }) {
    const data = global.__spamCache;

    if (!data || !data.threads)
      return message.reply("❌ Spam group data not available yet.");

    const topGroups = Object.entries(data.threads)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (topGroups.length === 0)
      return message.reply("ℹ️ No spam group data found.");

    let text = "🏘️ 𝗧𝗢𝗣 𝟭𝟬 𝗦𝗣𝗔𝗠 𝗚𝗥𝗢𝗨𝗣𝗦\n\n";

    let i = 1;
    for (const [threadID, count] of topGroups) {
      let name = "Unknown Group";
      try {
        const thread = await threadsData.get(threadID);
        if (thread?.threadName) name = thread.threadName;
      } catch {}

      text += `${i}. ${name}\n🆔 ${threadID}\n📨 Spam Count → ${count}\n\n`;
      i++;
    }

    message.reply(text.trim());
  }
};
