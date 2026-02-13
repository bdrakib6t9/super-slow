const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");
const ownerUID = require("../../rakib/customApi/ownerUid.js");

module.exports = {
	config: {
		name: "admain",
		version: "1.7",
		author: "NTKhang + Rakib",
		countDown: 5,
		role: 0,
		description: {
			en: "Add, remove, edit admin role (owner only)"
		},
		category: "box chat"
	},

	onStart: async function ({ message, args, usersData, event }) {

		// 🔒 Owner Check (string-safe)
		if (!ownerUID.includes(String(event.senderID)))
			return message.reply("❌ Owner only command.");

		switch (args[0]) {

			case "add":
			case "-a": {
				let uids = [];

				if (Object.keys(event.mentions).length > 0)
					uids = Object.keys(event.mentions);
				else if (event.messageReply)
					uids.push(event.messageReply.senderID);
				else
					uids = args.slice(1).filter(arg => !isNaN(arg));

				if (!uids.length)
					return message.reply("⚠️ Provide UID or tag user.");

				const added = [];
				const already = [];

				for (const uid of uids) {
					const strUID = String(uid);
					if (config.adminBot.includes(strUID))
						already.push(strUID);
					else {
						config.adminBot.push(strUID);
						added.push(strUID);
					}
				}

				writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

				return message.reply(
					(added.length ? `✅ Added:\n${added.join("\n")}\n\n` : "") +
					(already.length ? `⚠️ Already Admin:\n${already.join("\n")}` : "")
				);
			}

			case "remove":
			case "-r": {
				let uids = [];

				if (Object.keys(event.mentions).length > 0)
					uids = Object.keys(event.mentions);
				else
					uids = args.slice(1).filter(arg => !isNaN(arg));

				if (!uids.length)
					return message.reply("⚠️ Provide UID or tag user.");

				const removed = [];
				const notAdmin = [];

				for (const uid of uids) {
					const strUID = String(uid);
					if (config.adminBot.includes(strUID)) {
						config.adminBot.splice(config.adminBot.indexOf(strUID), 1);
						removed.push(strUID);
					} else {
						notAdmin.push(strUID);
					}
				}

				writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

				return message.reply(
					(removed.length ? `✅ Removed:\n${removed.join("\n")}\n\n` : "") +
					(notAdmin.length ? `⚠️ Not Admin:\n${notAdmin.join("\n")}` : "")
				);
			}

			case "list":
			case "-l": {
				return message.reply(
					"👑 Admin List:\n" +
					(config.adminBot.length
						? config.adminBot.join("\n")
						: "No admins found.")
				);
			}

			default:
				return message.reply("⚠️ Usage: admin add/remove/list");
		}
	}
};
