const { getPrefix, getStreamFromURL } = global.utils; // ⬅ getStreamFromURL যোগ করা হলো
const { commands, aliases } = global.GoatBot;

module.exports = {
  config: {
    name: "help",
    version: "1.17",
    author: "Ktkhang | modified HOON",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "View command usage and list all commands directly",
    },
    longDescription: {
      en: "View command usage and list all commands directly",
    },
    category: "info",
    guide: {
      en: "help cmdName",
    },
    priority: 1,
  },

  onStart: async function ({ message, args, event, threadsData, role }) {
    const { threadID } = event;
    const threadData = await threadsData.get(threadID);
    const prefix = getPrefix(threadID);

    // ⬅ আগে থেকেই লিঙ্কটা সেট করে রাখলাম
    const helpImageURL = "https://i.postimg.cc/QtjvWYKD/Messenger-creation-433A514F-EC56-4FE8-9311-EC29DBEED5F3.jpg";

    if (args.length === 0) {
      const categories = {};
      let msg = "";

      msg += ``;

      for (const [name, value] of commands) {
        if (value.config.role > 1 && role < value.config.role) continue;

        const category = value.config.category || "Uncategorized";
        categories[category] = categories[category] || { commands: [] };
        categories[category].commands.push(name);
      }

      Object.keys(categories).forEach((category) => {
        if (category !== "info") {
          msg += `\n╭─────⭓ ${category.toUpperCase()}`;

          const names = categories[category].commands.sort();
          for (let i = 0; i < names.length; i += 3) {
            const cmds = names.slice(i, i + 2).map((item) => `✧${item}`);
            msg += `\n│${cmds.join(" ".repeat(Math.max(1, 5 - cmds.join("").length)))}`;
          }

          msg += `\n╰────────────⭓\n`;
        }
      });

      const totalCommands = commands.size;
      msg += `\n\n⭔Bot has ${totalCommands} commands\n⭔Type ${prefix}𝐡𝐞𝐥𝐩 <𝚌𝚘𝚖𝚖𝚊𝚗𝚍 𝚗𝚊𝚖𝚎> to learn Usage.\n`;
      msg += ``;
      msg += `\n╭─✦ADMIN: TESSA\n├‣ FACEBOOK\n╰‣:https://www.facebook.com/profile.php?id=100052705607822`;

      try {
        // ⬅ ছবি থেকে স্ট্রিম নিয়ে রিপ্লাইতে অ্যাটাচ করলাম
        const imageStream = await getStreamFromURL(helpImageURL);

        const hh = await message.reply({
          body: msg,
          attachment: imageStream
        });

        setTimeout(() => {
          message.unsend(hh.messageID);
        }, 80000);

      } catch (error) {
        console.error("Error sending help message:", error);
      }

    } else {
      const commandName = args[0].toLowerCase();
      const command = commands.get(commandName) || commands.get(aliases.get(commandName));

      if (!command) {
        await message.reply(`Command "${commandName}" not found.`);
      } else {
        const configCommand = command.config;
        const roleText = roleTextToString(configCommand.role);
        const author = configCommand.author || "Unknown";

        const longDescription = configCommand.longDescription
          ? configCommand.longDescription.en || "No description"
          : "No description";

        const guideBody = configCommand.guide?.en || "No guide available.";
        const usage = guideBody
          .replace(/{he}/g, prefix)
          .replace(/{lp}/g, configCommand.name);

        const response = `╭─────────⭓\n│ 🎀 NAME: ${configCommand.name}\n│ 📃 Aliases: ${configCommand.aliases ? configCommand.aliases.join(", ") : "Do not have"}\n├──‣ INFO\n│ 📝 𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝘁𝗶𝗼𝗻: ${longDescription}\n│ 👑 𝗔𝗱𝗺𝗶𝗻: TESSA\n│ 📚 𝗚𝘂𝗶𝗱𝗲: ${usage}\n├──‣ Usage\n│ ⭐ 𝗩𝗲𝗿𝘀𝗶𝗼𝗻: ${configCommand.version || "1.0"}\n│ ♻️ 𝗥𝗼𝗹𝗲: ${roleText}\n╰────────────⭓`;

        // চাইলে নিচের অংশেও একই পিক অ্যাটাচ করতে পারো
        const imageStream = await getStreamFromURL(helpImageURL);

        const helpMessage = await message.reply({
          body: response,
          attachment: imageStream
        });

        setTimeout(() => {
          message.unsend(helpMessage.messageID);
        }, 80000);
      }
    }
  },
};

function roleTextToString(roleText) {
  switch (roleText) {
    case 0:
      return "0 (All users)";
    case 1:
      return "1 (Group administrators)";
    case 2:
      return "2 (Admin bot)";
    default:
      return "Unknown role";
  }
	}
