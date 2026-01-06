module.exports = {
	config: {
		name: "inventory",
		aliases: ["inv"],
		author: "Rakib",
		role: 0,
		category: "economy",
		countDown: 5
	},

	onStart: async function ({ message, event, usersData }) {
		const userID = event.senderID;
		let userData = await usersData.get(userID) || {};
		const inv = userData.inventory || {};

		if (Object.keys(inv).length === 0)
			return message.reply("🎒 তোমার Inventory খালি।");

		let text = "🎒 তোমার Inventory:\n\n";
		for (const k in inv) {
			text += `• ${k} × ${inv[k]}\n`;
		}

		return message.reply(text);
	}
};
