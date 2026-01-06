module.exports = {
	config: {
		name: "use-lootbox",
		aliases: ["uselt", "use lt"],
		author: "Rakib+ChatGPT",
		role: 0,
		category: "economy",
		countDown: 5
	},

	onStart: async function ({ message, event, usersData }) {
		const userID = event.senderID;

		let userData = await usersData.get(userID) || {};
		userData.inventory = userData.inventory || {};
		userData.money = userData.money || 0;
		userData.exp = userData.exp || 0;

		if (!userData.inventory.lootbox)
			return message.reply("❌ তোমার কাছে Lootbox নেই।");

		userData.inventory.lootbox -= 1;
		if (userData.inventory.lootbox <= 0)
			delete userData.inventory.lootbox;

		const rewards = [
			{ money: 5000 },
			{ money: 10000 },
			{ exp: 3000 },
			{ exp: 5000 }
		];

		const r = rewards[Math.floor(Math.random() * rewards.length)];
		let text = "🎁 Lootbox খুলেছো!\n";

		if (r.money) {
			userData.money += r.money;
			text += `💰 +${r.money}$`;
		}
		if (r.exp) {
			userData.exp += r.exp;
			text += `✨ +${r.exp} EXP`;
		}

		await usersData.set(userID, userData);
		return message.reply(text);
	}
};
