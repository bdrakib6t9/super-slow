module.exports = {
	config: {
		name: "mymsg",
		aliases: ["msgcount"],
		version: "1.2",
		author: "Rakib",
		countDown: 5,
		role: 0,
		category: "group"
	},

	onStart: async function ({ message, threadsData, event, usersData }) {
		const threadID = event.threadID;

		// default = নিজের
		let targetID = event.senderID;

		// mention থাকলে সঠিক uid নাও
		if (event.mentions && Object.keys(event.mentions).length > 0) {
			const mention = Object.values(event.mentions)[0];
			if (mention?.id)
				targetID = mention.id;
		}

		const threadData = await threadsData.get(threadID);
		if (!threadData || !threadData.members)
			return message.reply("❌ কোনো ডাটা পাওয়া যায়নি");

		const member = threadData.members.find(m => String(m.userID) === String(targetID));

		const name = await usersData.getName(targetID);

		if (!member)
			return message.reply(`❌ ${name} এর কোনো ডাটা পাওয়া যায়নি`);

		return message.reply(
			`📊 ${name} এই গ্রুপে মোট ${member.count || 0} টি মেসেজ করেছেন`
		);
	}
};
