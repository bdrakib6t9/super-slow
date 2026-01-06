module.exports = {
	config: {
		name: "game-info",
		aliases: ["gm info", "gameinfo", "profile"],
		version: "1.0",
		author: "Rakib",
		role: 0,
		category: "game",
		countDown: 5
	},

	onStart: async function ({ message, event, usersData }) {
		let targetID = event.senderID;
		let targetName = event.senderName || "User";

		// 👤 if mention
		if (Object.keys(event.mentions || {}).length > 0) {
			targetID = Object.keys(event.mentions)[0];
			targetName = event.mentions[targetID];
		}

		let userData = await usersData.get(targetID) || {};

		const money = userData.money || 0;
		const exp = userData.exp || 0;
		const level = Math.floor(exp / 1000);

		const inv = userData.inventory || {};
		const vip = inv.vip ? "Yes ✅" : "No ❌";
		const expboost = inv.expboost || 0;
		const lootbox = inv.lootbox || 0;

		let text =
			`🎮 GAME PROFILE\n\n` +
			`👤 Name: ${targetName}\n` +
			`🆔 ID: ${targetID}\n\n` +
			`💰 Balance: ${money}$\n` +
			`✨ EXP: ${exp}\n` +
			`🏅 Level: ${level}\n\n` +
			`🎒 Inventory:\n` +
			`• VIP: ${vip}\n` +
			`• EXP Boost: ${expboost}\n` +
			`• Lootbox: ${lootbox}`;

		return message.reply(text);
	}
};
