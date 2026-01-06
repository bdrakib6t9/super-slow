module.exports = {
	config: {
		name: "lottery",
		aliases: ["lot"],
		version: "4.0",
		author: "Rakib",
		role: 0,
		category: "game",
		countDown: 5
	},

	onStart: async function ({ api, message, event, args, usersData, threadsData }) {
		const { senderID } = event;
		const sub = args[0];

		if (!global.lottery)
			global.lottery = null;

		/* ======================
		   🎟️ LOTTERY ON
		====================== */
		if (sub === "on") {
			if (global.lottery?.active)
				return message.reply("⚠️ Lottery already running!");

			const price = parseInt(args[1]);
			if (!price || price <= 0)
				return message.reply("❌ Invalid entry fee.");

			global.lottery = {
				active: true,
				price,
				owner: senderID,
				players: [],
				messageIDs: [],
				threadIDs: [],
				timer: null
			};

			const allThreads = await threadsData.getAll();

			for (const t of allThreads) {
				if (!t.isGroup) continue;

				const sent = await api.sendMessage(
					`🎟️ GLOBAL LOTTERY STARTED!\n\n` +
					`💵 Entry fee: ${price}$\n` +
					`👥 Minimum players: 3\n` +
					`🎁 Join EXP: +500\n` +
					`⏱ Auto end: 5 minutes\n\n` +
					`👉 Reply to THIS message to join`,
					t.threadID
				);

				// ✅ CORRECT onReply register
				global.GoatBot.onReply.set(sent.messageID, {
					commandName: "lottery",
					author: senderID
				});

				global.lottery.messageIDs.push(sent.messageID);
				global.lottery.threadIDs.push(t.threadID);
			}

			// ⏱ AUTO END
			global.lottery.timer = setTimeout(async () => {
				await endLottery(api, usersData);
			}, 5 * 60 * 1000);

			return message.reply("✅ Lottery started in all groups!");
		}

		/* ======================
		   ⛔ LOTTERY OFF
		====================== */
		if (sub === "off") {
			const lot = global.lottery;
			if (!lot || !lot.active)
				return message.reply("⚠️ No active lottery.");

			if (senderID !== lot.owner)
				return message.reply("❌ Only starter can end lottery.");

			clearTimeout(lot.timer);
			await endLottery(api, usersData);
		}
	},

	/* ======================
	   📩 JOIN BY REPLY
	====================== */
	onReply: async function ({ api, event, usersData }) {
		const lot = global.lottery;
		if (!lot || !lot.active) return;

		if (!event.messageReply ||
			!lot.messageIDs.includes(event.messageReply.messageID))
			return;

		const userID = event.senderID;
		const name = event.senderName || "User";

		// already joined
		const existed = lot.players.find(p => p.id === userID);
		if (existed) {
			return api.sendMessage(
				`⚠️ ${name}, তুমি আগেই join করেছো!\n🔢 তোমার নাম্বার: #${existed.number}`,
				event.threadID
			);
		}

		let userData = await usersData.get(userID) || {};
		userData.money = userData.money || 0;
		userData.exp = userData.exp || 0;

		if (userData.money < lot.price)
			return api.sendMessage("❌ Not enough balance.", event.threadID);

		// deduct + exp
		userData.money -= lot.price;
		userData.exp += 500;
		await usersData.set(userID, userData);

		const number = lot.players.length + 1;

		lot.players.push({
			id: userID,
			name,
			number
		});

		return api.sendMessage(
			`✅ ${name} joined lottery!\n🔢 Your number: #${number}\n🎁 +500 EXP`,
			event.threadID
		);
	}
};

/* ======================
   🎉 END LOTTERY
====================== */
async function endLottery(api, usersData) {
	const lot = global.lottery;
	if (!lot) return;

	lot.active = false;

	// ❌ minimum player
	if (lot.players.length < 3) {
		for (const p of lot.players) {
			let u = await usersData.get(p.id) || {};
			u.money = (u.money || 0) + lot.price;
			await usersData.set(p.id, u);
		}

		for (const tid of lot.threadIDs) {
			await api.sendMessage(
				"❌ LOTTERY CANCELLED!\nReason: Less than 3 players.\n💸 All money refunded.",
				tid
			);
		}

		global.lottery = null;
		return;
	}

	// 🎲 shuffle
	const shuffled = [...lot.players].sort(() => Math.random() - 0.5);
	const pot = lot.players.length * lot.price;

	const rewards = [
		{ rank: "🥇 1st", percent: 0.5, exp: 3000 },
		{ rank: "🥈 2nd", percent: 0.3, exp: 2000 },
		{ rank: "🥉 3rd", percent: 0.2, exp: 1000 }
	];

	let text =
		`🎉 GLOBAL LOTTERY RESULT 🎉\n\n💰 Total Prize: ${pot}$\n\n`;

	for (let i = 0; i < 3; i++) {
		const w = shuffled[i];
		const prize = Math.floor(pot * rewards[i].percent);

		let u = await usersData.get(w.id) || {};
		u.money = (u.money || 0) + prize;
		u.exp = (u.exp || 0) + rewards[i].exp;
		await usersData.set(w.id, u);

		text +=
			`${rewards[i].rank}: ${w.name} (#${w.number})\n` +
			`💵 ${prize}$ + ${rewards[i].exp} EXP\n\n`;
	}

	for (const tid of lot.threadIDs) {
		await api.sendMessage(text, tid);
	}

	global.lottery = null;
		}
