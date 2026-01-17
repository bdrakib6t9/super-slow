const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "coverpic",
    aliases: ["cvpic"],
    version: "1.0",
    author: "Rakib",
    category: "utility",
    guide: "{prefix}coverpic (reply / mention / empty = own cover)"
  },

  onStart: async function ({ event, message, usersData }) {
    try {
      let targetID = event.senderID;

      // 1️⃣ reply থাকলে
      if (event.type === "message_reply" && event.messageReply) {
        targetID = event.messageReply.senderID;
      }
      // 2️⃣ mention থাকলে
      else if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      }

      // নাম
      const name = await usersData.getName(targetID).catch(() => "User");

      // 👉 cover url নেওয়ার চেষ্টা
      let coverUrl = null;
      try {
        // Goat-Bot এ অনেক সময় এটা available থাকে
        coverUrl = await usersData.getCoverUrl(targetID);
      } catch {}

      // fallback: Facebook Graph API (public cover হলে কাজ করবে)
      if (!coverUrl) {
        coverUrl = `https://graph.facebook.com/${targetID}?fields=cover&access_token=YOUR_TOKEN`;
      }

      // যদি cover না থাকে
      if (!coverUrl || typeof coverUrl !== "string") {
        return message.reply("❌ এই ইউজারের কভার পিক পাওয়া যায়নি।");
      }

      const coverStream = await getStreamFromURL(coverUrl);
      coverStream.path = "cover.jpg";

      return message.reply({
        body: `🖼️ ${name} এর Cover Photo`,
        attachment: coverStream
      });

    } catch (err) {
      console.error(err);
      return message.reply("❌ Cover photo ডাউনলোড করতে সমস্যা হয়েছে।");
    }
  }
};
