const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

module.exports = {
	config: {
		name: "white-list",
		aliases: ["wls"],
		version: "1.1",
		author: "Rakib",
		countDown: 5,
		role: 2,
		longDescription: {
			en: "Manage whiteList users (add, remove, list, on/off)"
		},
		category: "owner",
		guide: {
			en:
				"{pn} add <uid | @tag | reply>: Add user to whitelist\n" +
				"{pn} remove <uid | @tag | reply>: Remove user from whitelist\n" +
				"{pn} list: Show whitelist users\n" +
				"{pn} on: Enable whitelist mode\n" +
				"{pn} off: Disable whitelist mode"
		}
	},

	langs: {
		en: {
			added: "✅ Added to whitelist (%1):\n%2",
			already: "⚠ Already in whitelist (%1):\n%2",
			missingAdd: "⚠ Please provide UID / tag / reply to add",
			removed: "✅ Removed from whitelist (%1):\n%2",
			notFound: "⚠ Not in whitelist (%1):\n%2",
			missingRemove: "⚠ Please provide UID / tag / reply to remove",
			list: "👑 Whitelist Users:\n%1",
			enable: "✅ Whitelist mode enabled",
			disable: "✅ Whitelist mode disabled"
		}
	},

	onStart: async function ({ message, args, usersData, event, getLang }) {
		const sub = args[0];

		// helper: collect uids
		const getUIDs = () => {
			let uids = [];
			if (Object.keys(event.mentions).length > 0)
				uids = Object.keys(event.mentions);
			else if (event.messageReply)
				uids.push(event.messageReply.senderID);
			else
				uids = args.slice(1).filter(id => !isNaN(id));
			return uids;
		};

		switch (sub) {
			case "add": {
				const uids = getUIDs();
				if (!uids.length) return message.reply(getLang("missingAdd"));

				const added = [];
				const already = [];

				for (const uid of uids) {
					if (config.whiteListMode.whiteListIds.includes(uid))
						already.push(uid);
					else {
						config.whiteListMode.whiteListIds.push(uid);
						added.push(uid);
					}
				}

				writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

				const namesAdded = await Promise.all(
					added.map(uid => usersData.getName(uid).then(name => `• ${name} (${uid})`))
				);
				const alreadyTxt = already.map(uid => `• ${uid}`).join("\n");

				return message.reply(
					(added.length ? getLang("added", added.length, namesAdded.join("\n")) + "\n" : "") +
					(already.length ? getLang("already", already.length, alreadyTxt) : "")
				);
			}

			case "remove": {
				const uids = getUIDs();
				if (!uids.length) return message.reply(getLang("missingRemove"));

				const removed = [];
				const notFound = [];

				for (const uid of uids) {
					const index = config.whiteListMode.whiteListIds.indexOf(uid);
					if (index !== -1) {
						config.whiteListMode.whiteListIds.splice(index, 1);
						removed.push(uid);
					} else notFound.push(uid);
				}

				writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

				const namesRemoved = await Promise.all(
					removed.map(uid => usersData.getName(uid).then(name => `• ${name} (${uid})`))
				);

				return message.reply(
					(removed.length ? getLang("removed", removed.length, namesRemoved.join("\n")) + "\n" : "") +
					(notFound.length ? getLang("notFound", notFound.length, notFound.map(id => `• ${id}`).join("\n")) : "")
				);
			}

			case "list": {
				if (!config.whiteListMode.whiteListIds.length)
					return message.reply("⚠ Whitelist is empty");

				const list = await Promise.all(
					config.whiteListMode.whiteListIds.map(uid =>
						usersData.getName(uid).then(name => `• ${name} (${uid})`)
					)
				);
				return message.reply(getLang("list", list.join("\n")));
			}

			case "on":
				config.whiteListMode.enable = true;
				writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
				return message.reply(getLang("enable"));

			case "off":
				config.whiteListMode.enable = false;
				writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
				return message.reply(getLang("disable"));

			default:
				return message.SyntaxError();
		}
	}
};
