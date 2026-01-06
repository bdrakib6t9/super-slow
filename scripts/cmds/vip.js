const fs = require("fs");

const header = `👑 𝗧𝗘𝗦𝗦𝗔 𝗩𝗜𝗣 𝗨𝗦𝗘𝗥𝗦 👑`;

const vipFilePath = "vip.json";
const changelogFilePath = "changelog.json";

/* -------------------- FILE HELPERS -------------------- */

function loadVIPData() {
	try {
		if (!fs.existsSync(vipFilePath)) return {};
		return JSON.parse(fs.readFileSync(vipFilePath));
	} catch (err) {
		console.error("Error loading VIP data:", err);
		return {};
	}
}

function saveVIPData(data) {
	try {
		fs.writeFileSync(vipFilePath, JSON.stringify(data, null, 2));
	} catch (err) {
		console.error("Error saving VIP data:", err);
	}
}

function loadChangelog() {
	try {
		if (!fs.existsSync(changelogFilePath)) return {};
		return JSON.parse(fs.readFileSync(changelogFilePath));
	} catch (err) {
		console.error("Error loading changelog:", err);
		return {};
	}
}

/* -------------------- SAFE USERNAME -------------------- */

async function getUserNameSafe(usersData, uid) {
	try {
		const userData = await usersData.get(uid);
		if (!userData || !userData.name) return `Unknown User (${uid})`;
		return `${userData.name} (${uid})`;
	} catch {
		return `Unknown User (${uid})`;
	}
}

/* -------------------- COMMAND -------------------- */

module.exports = {
	config: {
		name: "vip",
		version: "1.1",
		author: "Aryan Chauhan (fixed)",
		role: 2,
		category: "Config",
		guide: {
			en:
				"!vip add <uid>\n" +
				"!vip rm <uid>\n" +
				"!vip list\n" +
				"!vip changelog"
		}
	},

	onStart: async function ({ api, event, args, message, usersData }) {
		const sub = args[0];
		if (!sub) return;

		let vipData = loadVIPData();

		/* ---------------- ADD VIP ---------------- */

		if (sub === "add") {
			const uid = args[1];
			if (!uid)
				return message.reply(`${header}\nPlease provide a UID.`);

			const userName = await getUserNameSafe(usersData, uid);

			if (vipData[uid])
				return message.reply(`${header}\nUser is already VIP.`);

			vipData[uid] = true;
			saveVIPData(vipData);

			message.reply(`${header}\n${userName} has been added to VIP list.`);
			api.sendMessage(
				`${header}\nCongratulations! You are now a VIP member 🎉`,
				uid
			);

			for (const vid of Object.keys(vipData)) {
				if (vid !== uid) {
					api.sendMessage(
						`${header}\nWelcome our new VIP member:\n${userName}`,
						vid
					);
				}
			}
		}

		/* ---------------- REMOVE VIP ---------------- */

		else if (sub === "rm") {
			const uid = args[1];
			if (!uid || !vipData[uid])
				return message.reply(`${header}\nInvalid VIP UID.`);

			const userName = await getUserNameSafe(usersData, uid);

			delete vipData[uid];
			saveVIPData(vipData);

			message.reply(`${header}\n${userName} removed from VIP list.`);
			api.sendMessage(
				`${header}\nYou have been removed from VIP list.`,
				uid
			);

			for (const vid of Object.keys(vipData)) {
				api.sendMessage(
					`${header}\nVIP update:\n${userName} is no longer VIP.`,
					vid
				);
			}
		}

		/* ---------------- VIP LIST ---------------- */

		else if (sub === "list") {
			const ids = Object.keys(vipData);

			if (!ids.length)
				return message.reply(`${header}\nVIP list is empty.`);

			const list = [];
			for (const uid of ids) {
				list.push(`• ${await getUserNameSafe(usersData, uid)}`);
			}

			message.reply(
				`${header}\n\n» VIP Members:\n\n${list.join("\n")}`
			);
		}

		/* ---------------- CHANGELOG ---------------- */

		else if (sub === "changelog") {
			const changelog = loadChangelog();
			const versions = Object.keys(changelog);

			if (!versions.length)
				return message.reply(`${header}\nNo changelog found.`);

			const text = versions
				.map(v => `Version ${v}: ${changelog[v]}`)
				.join("\n");

			message.reply(
				`${header}\nCurrent Version: ${this.config.version}\n\n${text}`
			);
		}
	}
};
