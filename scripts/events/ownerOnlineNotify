const OWNER_ID = "61581351693349";

module.exports = {
  config: {
    name: "ownerOnlineNotify",
    category: "events"
  },

  onStart: async function ({ api }) {
    try {
      await api.sendMessage(
        "✅ GoatBot is ONLINE (Render)",
        OWNER_ID
      );
      console.log("Owner notified");
    } catch (err) {
      console.log("Owner notify failed:", err.message);
    }
  }
};
