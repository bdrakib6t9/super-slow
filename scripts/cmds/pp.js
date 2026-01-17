const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "pp",
    aliases: ["dp"],
    version: "1.0",
    author: "Rakib",
    category: "utility",
    guide: "{prefix}pp (reply / mention / empty = own dp)"
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

      // নাম + avatar
      const name = await usersData.getName(targetID).catch(() => "User");
      const avatarUrl = await usersData.getAvatarUrl(targetID).catch(() => null);

      if (!avatarUrl) {
        return message.reply("❌ এই ইউজারের প্রোফাইল পিক পাওয়া যায়নি।");
      }

      const avatarStream = await getStreamFromURL(avatarUrl);
      avatarStream.path = "profile.jpg";

      return message.reply({
        body: `🖼️ ${name} এর প্রোফাইল পিক`,
        attachment: avatarStream
      });

    } catch (err) {
      console.error(err);
      return message.reply("❌ Profile picture ডাউনলোড করতে সমস্যা হয়েছে।");
    }
  }
};
