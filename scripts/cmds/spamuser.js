module.exports = {
  config: {
    name: "spamuser",
    aliases: ["spmuser", "spamusers"],
    version: "1.0",
    author: "Rakib",
    role: 2,
    shortDescription: "Show top spam users",
    category: "system",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ message, usersData }) {
    const data = global.__spamCache;

    if (!data || !data.users)
      return message.reply("❌ Spam user data not available yet.");

    const topUsers = Object.entries(data.users)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    if (topUsers.length === 0)
      return message.reply("ℹ️ No spam user data found.");

    let text = "👤 𝗧𝗢𝗣 𝟭𝟱 𝗦𝗣𝗔𝗠 𝗨𝗦𝗘𝗥𝗦\n\n";

    let i = 1;
    for (const [uid, count] of topUsers) {
      let name = "Unknown User";
      try {
        const user = await usersData.get(uid);
        if (user?.name) name = user.name;
      } catch {}

      text += `${i}. ${name}\n🆔 ${uid}\n📨 Spam Count → ${count}\n\n`;
      i++;
    }

    message.reply(text.trim());
  }
};
