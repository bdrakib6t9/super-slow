module.exports = {
  config: {
    name: "broken",
    aliases: ["brokengc"],
    category: "system",
    role: 1
  },

  onStart: async function ({ message, args, threadsData, event }) {
    if (!event.threadID || event.isGroup === false)
      return message.reply("❌ This command only works in group");

    const action = args[0];
    if (!["on", "off"].includes(action))
      return message.reply("ℹ️ Use: broken on | broken off");

    const enable = action === "on";

    await threadsData.set(
      event.threadID,
      enable,
      "brokenGC.enabled"
    );

    message.reply(
      `🛡️ Auto Broken GC Scanner is now **${enable ? "ON" : "OFF"}** for this group`
    );
  }
};
