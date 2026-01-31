module.exports = {
  config: {
    name: "spamcmd",
    aliases: ["cmdtop", "cmdspam"],
    version: "1.0",
    author: "Rakib",
    role: 2,
    shortDescription: "Show top used commands",
    category: "system",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ message }) {
    const data = global.__spamCache;

    if (!data || !data.commands)
      return message.reply("❌ Spam command data not available yet.");

    const topCommands = Object.entries(data.commands)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    if (topCommands.length === 0)
      return message.reply("ℹ️ No command usage data found.");

    const list = topCommands
      .map(([cmd, count], i) => `${i + 1}. ${cmd} → ${count}`)
      .join("\n");

    const msg =
`⚙️ 𝗧𝗢𝗣 𝟭𝟱 𝗠𝗢𝗦𝗧 𝗨𝗦𝗘𝗗 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦

${list}
`;

    message.reply(msg);
  }
};
