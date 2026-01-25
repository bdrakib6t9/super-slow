module.exports = {
	config: {
		name: "ngc",
		aliases: ["setgc", "set-gc"],
		version: "1.2",
		author: "ChatGPT",
		countDown: 5,
		role: 0,
		shortDescription: {
			en: "Change group chat name"
		},
		description: {
			en: "Change group chat name (no admin required)"
		},
		category: "box chat"
	},

	onStart: async function ({ args, event, api, message }) {
		try {
			if (!event.isGroup)
				return message.reply("❌ এটা কোনো গ্রুপ চ্যাট না।");

			const newName = args.join(" ").trim();

			if (!newName)
				return message.reply(
					"⚠️ নতুন গ্রুপ নাম দিন।\nউদাহরণ: ngc My Group Name"
				);

			await api.setTitle(newName, event.threadID);

			return message.reply(
				`✅ গ্রুপের নাম পরিবর্তন করা হয়েছে:\n${newName}`
			);
		}
		catch (e) {
			return message.reply(
				"⚠️ গ্রুপের নাম পরিবর্তন করা যায়নি!"
			);
		}
	}
};
