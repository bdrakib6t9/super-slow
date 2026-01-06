const axios = require("axios");

global.autoTeachCooldown ??= {};

module.exports = {
  config: {
    name: "auto-teach",
    eventType: ["message"],
    category: "events"
  },

  onStart: async function ({ event, api }) {
    try {
      if (!event?.senderID) return;
      if (event.senderID === api.getCurrentUserID()) return;
      if (!event.messageReply) return;

      const key = `${event.senderID}_${event.threadID}`;
      if (global.autoTeachCooldown[key] &&
          Date.now() - global.autoTeachCooldown[key] < 5000)
        return;

      global.autoTeachCooldown[key] = Date.now();

      const getContent = m =>
        m?.body || m?.attachments?.[0]?.url || "";

      const reply = getContent(event);
      const question = getContent(event.messageReply);
      if (!reply || !question) return;

      await axios.post(
        "https://rakib-api.vercel.app/api/simma-listen",
        {
          apikey: "rakib69",
          question,
          reply,
          isReply: true,
          userId: event.senderID,
          from: event.senderID,
          to: event.messageReply.senderID
        },
        { timeout: 10_000 }
      );
    }
    catch (e) {
      console.error("[AUTO-TEACH]", e.message);
    }
  }
};
