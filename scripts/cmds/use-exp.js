module.exports = {
	config: {
		name: "use-exp",
		aliases: ["useexp", "use exp"],
		author: "Rakib",
		role: 0,
		category: "economy",
		countDown: 5
	},

	onStart: async function ({ message, event, usersData }) {
		const userID = event.senderID;

		let userData = await usersData.get(userID) || {};
		userData.inventory = userData.inventory || {};
		userData.exp = userData.exp || 0;

		if (!userData.inventory.expboost)
			return message.reply("❌ তোমার কাছে EXP Boost নেই।");

		userData.inventory.expboost -= 1;
		if (userData.inventory.expboost <= 0)
			delete userData.inventory.expboost;

		userData.exp += 2000;
		await usersData.set(userID, userData);

		return message.reply("⚡ EXP Boost ব্যবহার করা হয়েছে!\n✨ +2000 EXP");
	}
};
