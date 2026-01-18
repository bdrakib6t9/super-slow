module.exports = {
	config: {
		name: "showname",
		version: "1.0",
		author: "Rakib",
		countDown: 5,
		role: 0,
		shortDescription: {
			en: "Show nickname of yourself or others"
		},
		description: {
			en: "Show nickname of yourself, mentioned user, or replied user"
		},
		category: "box chat"
	},

	onStart: async function ({ event, api, message }) {
		try {
			let uid;

			// 1️⃣ Reply করা হলে
			if (event.messageReply)
				uid = event.messageReply.senderID;

			// 2️⃣ Mention করা হলে
			else if (Object.keys(event.mentions).length > 0)
				uid = Object.keys(event.mentions)[0];

			// 3️⃣ না হলে নিজের
			else
				uid = event.senderID;

			const threadInfo = await api.getThreadInfo(event.threadID);
			const userInfo = threadInfo.nicknames || {};
			const nickname = userInfo[uid];

			if (!nickname)
				return message.reply("❌ এই ইউজারের কোনো nickname সেট করা নেই।");

			return message.reply(`✅ Nickname:\n${nickname}`);
		}
		catch (e) {
			return message.reply("⚠️ কিছু একটা সমস্যা হয়েছে!");
		}
	}
};
