const utils = require("../../utils.js");

/* ======================
   CASINO RANK SYSTEM
====================== */
function getCasinoRank(wins) {
	if (wins >= 150) return { name: "👑 Legend", bonus: 12 };
	if (wins >= 75)  return { name: "💎 Elite", bonus: 8 };
	if (wins >= 30)  return { name: "🥇 Pro", bonus: 5 };
	if (wins >= 10)  return { name: "🥈 Player", bonus: 2 };
	return { name: "🥉 Rookie", bonus: 0 };
}

module.exports = {
	config: {
		name: "bet",
		aliases: ["gamble"],
		version: "3.1",
		author: "Rakib",
		role: 0,
		category: "economy",
		description: {
			en: "Advanced casino bet game",
			bn: "উন্নত ক্যাসিনো বেট গেম"
		},
		guide: {
			en: "bet <low|mid|high> <amount>",
			bn: "bet <low|mid|high> <amount>"
		}
	},

	langs: {
		en: {
			invalid: "❌ Use: bet <low|mid|high> <amount>",
			notEnough: "❌ You don't have enough balance.",
			cooldown: "⏳ Wait 10 seconds before betting again."
		}
	},

	onStart: async function ({ message, event, args, usersData, getLang }) {
		const uid = event.senderID;
		const user = await usersData.get(uid) || {};
		const data = user.data || {};
		const name = user.name || "Unknown";

		/* ===== COOLDOWN ===== */
		const now = Date.now();
		if (now - (data.lastBetTime || 0) < 10_000)
			return message.reply(getLang("cooldown"));

		/* ===== LOAD BALANCES (SAFE) ===== */
		let wallet = utils.safeBigInt(user.money);
		let bank   = utils.safeBigInt(data.bank);

		/* ===== RISK SYSTEM ===== */
		const risk = (args[0] || "").toLowerCase();
		const riskMap = {
			low:  { chance: 65, reward: 1n },
			mid:  { chance: 50, reward: 1n },
			high: { chance: 30, reward: 2n }
		};

		if (!riskMap[risk] || !args[1])
			return message.reply(getLang("invalid"));

		/* ===== PARSE BET ===== */
		const betAmount = utils.parseAmount(
			args[1],
			"wallet",
			wallet,
			bank,
			0n
		);

		if (!betAmount || typeof betAmount !== "bigint" || betAmount <= 0n)
			return message.reply(getLang("invalid"));

		if (wallet < betAmount)
			return message.reply(getLang("notEnough"));

		/* ===== STREAK & RANK ===== */
		let streak = utils.safeBigInt(data.betStreak);
		let wins = Number(data.betWins || 0);
		const rank = getCasinoRank(wins);

		const streakBonus = Math.min(Number(streak) * 2, 10); // max +10%
		const houseEdge = 3;

		let finalChance =
			riskMap[risk].chance +
			streakBonus +
			rank.bonus -
			houseEdge;

		finalChance = Math.max(1, Math.min(finalChance, 95));

		/* ===== ROLL ===== */
		const roll = Math.random() * 100;
		const isWin = roll <= finalChance;

		let history = data.betHistory || [];
		let text = "";
		let bar = "🎰 ┃ ";

		if (isWin) {
			const winAmount = betAmount * riskMap[risk].reward;
			wallet += winAmount;

			streak += 1n;
			wins += 1;

			bar += "💎✨💎";

			text =
				"🎉 **BET WIN!** 🎉\n\n" +
				`👤 Player: ${name}\n` +
				`🎖️ Rank: ${rank.name} (+${rank.bonus}%)\n` +
				`🎯 Risk: ${risk.toUpperCase()}\n` +
				`🔥 Win Streak: ${streak} (+${streakBonus}%)\n` +
				`🧠 House Edge: -${houseEdge}%\n` +
				`📈 Final Chance: ${finalChance.toFixed(2)}%\n` +
				`💰 Amount Won: +${utils.formatMoney(winAmount)}\n`;
		}
		else {
			wallet -= betAmount;
			streak = 0n;

			bar += "💀🔥💀";

			text =
				"💀 **BET LOSS! 😓** 💀\n\n" +
				`👤 Player: ${name}\n` +
				`🎖️ Rank: ${rank.name}\n` +
				`🎯 Risk: ${risk.toUpperCase()}\n` +
				`📉 Final Chance: ${finalChance.toFixed(2)}%\n` +
				`💸 Amount Lost: -${utils.formatMoney(betAmount)}\n`;
		}

		/* ===== AUTO BANK LIMIT (150cs SYSTEM) ===== */
		const fixed = utils.applyWalletLimit(wallet, bank);
		wallet = fixed.wallet;
		bank   = fixed.bank;

		text +=
			`💼 Wallet: ${utils.formatMoney(wallet)}\n` +
			`🏦 Bank: ${utils.formatMoney(bank)}\n\n` +
			(isWin ? "😎 Fortune smiles upon you!" : "🙃 The house wins this round.");

		/* ===== SAVE HISTORY ===== */
		history.push({
			result: isWin ? "🎉 WIN" : "💀 LOSS",
			amount: betAmount.toString(),
			balance: wallet.toString(),
			time: Date.now()
		});
		if (history.length > 10) history.shift();

		/* ===== SAVE USER ===== */
		await usersData.set(uid, {
			...user,
			money: wallet.toString(),
			data: {
				...data,
				bank: bank.toString(),
				betStreak: streak.toString(),
				betWins: wins,
				betHistory: history,
				lastBetTime: now
			}
		});

		return message.reply(`${bar}\n\n${text}`);
	}
};
