module.exports = {
	config: {
		name: "sdname",
		version: "1.0",
		author: "Rakib",
		countDown: 5,
		role: 0,
		shortDescription: {
			en: "Show Facebook name"
		},
		description: {
			en: "Show Facebook profile name of user"
		},
		category: "user"
	},

	onStart: async function ({ event, api, message }) {
		try {
			let uid;

			// Reply করা হলে
			if (event.messageReply)
				uid = event.messageReply.senderID;

			// Mention করা হলে
			else if (Object.keys(event.mentions).length > 0)
				uid = Object.keys(event.mentions)[0];

			// না হলে নিজের
			else
				uid = event.senderID;

			const userInfo = await api.getUserInfo(uid);
			const name = userInfo[uid]?.name;

			if (!name)
				return message.reply("❌ ইউজারের নাম পাওয়া যায়নি।");

			return message.reply(`👤 Facebook Name:\n${name}`);
		}
		catch (e) {
			return message.reply("⚠️ Facebook নাম আনতে সমস্যা হয়েছে!");
		}
	}
};
