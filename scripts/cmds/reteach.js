const axios = require("axios");
const ownerUID = require("../../rakib/customApi/ownerUid.js");

module.exports = {
  config: {
    name: "reteach",
    version: "1.4",
    author: "rakib",
    role: 0,
    category: "ai",
    guide: {
      en: "reteach hi - hello"
    }
  },

  onStart: async function ({ api, event, args }) {

    // 🔒 Owner Check (string-safe)
    if (!ownerUID.includes(String(event.senderID))) {
      return api.sendMessage(
        "eta jar kaj se korbe - tomar dorkar nai",
        event.threadID,
        event.messageID
      );
    }

    const input = args.join(" ");

    let splitChar = input.includes("|")
      ? "|"
      : input.includes("-")
      ? "-"
      : null;

    if (!splitChar) {
      return api.sendMessage(
        "❌ Format:\nreteach hi - hlw",
        event.threadID,
        event.messageID
      );
    }

    const [question, newReply] = input
      .split(splitChar)
      .map(t => t.trim());

    if (!question || !newReply) {
      return api.sendMessage(
        "❌ Question বা Reply ফাঁকা",
        event.threadID,
        event.messageID
      );
    }

    try {
      const res = await axios.get(
        "https://rakib-api.vercel.app/api/simma-remove",
        {
          params: {
            question,
            newReply,
            apikey: "rakib69"
          }
        }
      );

      const msg =
        res.data?.message ||
        res.data?.result ||
        `✅ Reteach Successful\n🧠 ${question} → ${newReply}`;

      return api.sendMessage(
        msg,
        event.threadID,
        event.messageID
      );

    } catch (e) {
      return api.sendMessage(
        "❌ API error",
        event.threadID,
        event.messageID
      );
    }
  }
};
