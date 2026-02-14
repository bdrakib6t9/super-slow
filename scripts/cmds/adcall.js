const ownBox = require("../../rakib/customApi/ownBox");

module.exports = {
  config: {
    name: "adcall",
    version: "2.0",
    author: "Rakib",
    role: 0,
    shortDescription: "Send message to admin groups",
    category: "utility",
    guide: {
      en: "{pn} <message>"
    }
  },

  onStart: async function ({ api, event, args }) {

    const message = args.join(" ");

    if (!message)
      return api.sendMessage(
        "❌ Please provide a message.",
        event.threadID
      );

    try {

      const senderInfo = await api.getUserInfo(event.senderID);
      const senderName = senderInfo[event.senderID].name;

      const forwardMsg =
`📢 𝗔𝗗𝗖𝗔𝗟𝗟 𝗔𝗟𝗘𝗥𝗧

👤 From: ${senderName}
🆔 User ID: ${event.senderID}
💬 Message: ${message}

📍 From Group ID: ${event.threadID}`;

      // 🔥 Send to all admin groups
      for (const threadID of ownBox) {
        await api.sendMessage(forwardMsg, threadID);
      }

      api.sendMessage(
        "✅ Your message has been sent to admin group(s).",
        event.threadID
      );

    } catch (err) {
      console.error(err);
      api.sendMessage(
        "❌ Failed to send message.",
        event.threadID
      );
    }
  }
};
