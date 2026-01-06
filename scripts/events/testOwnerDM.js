const OWNER_ID = "61581351693349";

module.exports = {
  config: {
    name: "testOwnerDM",
    category: "events"
  },

  // 🔹 required
  onStart: async function () {},

  onLoad: async function ({ api }) {
    if (global.__OWNER_DM_SENT__) return;
    global.__OWNER_DM_SENT__ = true;

    try {
      await api.sendMessage(
        "✅ Bot is online (Owner notify)",
        OWNER_ID
      );
    } catch (e) {
      console.log("Owner DM failed:", e.message);
    }
  }
};
