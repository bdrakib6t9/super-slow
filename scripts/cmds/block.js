module.exports = {
  config: {
    name: "block",
    author: "Rakib",
    role: 2,
    shortDescription: "Block / Unblock user",
    category: "admin",
    guide: "{pn} [uid/@mention/link]\n{pn} unblock [uid/@mention/link]\nOr reply to a message"
  },

  onStart: async function ({ api, event, args }) {
    const axios = require("axios");
    let id;

    // 🔹 1. Reply করলে
    if (event.messageReply) {
      id = event.messageReply.senderID;
    }

    // 🔹 2. Mention করলে
    else if (Object.keys(event.mentions).length > 0) {
      id = Object.keys(event.mentions)[0];
    }

    // 🔹 3. Facebook link দিলে
    else if (args[1] && args[1].includes(".com/")) {
      try {
        const res = await axios.get(
          `https://eurix-api.diciper09.repl.co/finduid?link=${args[1]}`
        );
        id = res.data.result;
      } catch (e) {
        return api.sendMessage("❌ UID খুঁজে পাওয়া যায়নি", event.threadID);
      }
    }

    // 🔹 4. Direct UID দিলে
    else if (args[1]) {
      id = args[1];
    }

    if (!id)
      return api.sendMessage(
        "『 Wrong format 』\nReply করে বা UID / link / mention ব্যবহার করুন",
        event.threadID,
        event.messageID
      );

    // 🔒 Block
    if (args[0] === "block" && args[1] !== "unblock") {
      api.changeBlockedStatus(id, true, (err) => {
        if (err)
          return api.sendMessage(`${err}`, event.threadID, event.messageID);
        return api.sendMessage(
          "『 Successfully blocked user 』",
          event.threadID,
          event.messageID
        );
      });
    }

    // 🔓 Unblock
    else if (args[0] === "block" && args[1] === "unblock") {
      api.changeBlockedStatus(id, false, (err) => {
        if (err)
          return api.sendMessage(`${err}`, event.threadID, event.messageID);
        return api.sendMessage(
          "『 Successfully unblocked user 』",
          event.threadID,
          event.messageID
        );
      });
    }
  }
};
