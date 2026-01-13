const ITEMS_PER_PAGE = 10;

module.exports.config = {
  name: "cmdstore",
  aliases: ["allcmd", "cmds"],
  author: "Rakib",
  role: 0,
  version: "1.0",
  description: {
    en: "Show all local bot commands (no API)"
  },
  category: "system",
  guide: {
    en: "{pn} [page | command name]"
  }
};

module.exports.onStart = async function ({ api, event, args }) {
  const query = args.join(" ").toLowerCase();
  let page = 1;

  let allCmds = [...global.GoatBot.commands.values()];

  // 🔍 Search
  if (query) {
    if (!isNaN(query)) {
      page = parseInt(query);
    } else {
      allCmds = allCmds.filter(cmd =>
        cmd.config.name.toLowerCase().includes(query)
      );
      if (!allCmds.length) {
        return api.sendMessage(
          `❌ | "${query}" নামে কোনো কমান্ড নেই`,
          event.threadID,
          event.messageID
        );
      }
    }
  }

  const totalPages = Math.ceil(allCmds.length / ITEMS_PER_PAGE);
  if (page < 1 || page > totalPages) {
    return api.sendMessage(
      `❌ | Page number 1-${totalPages} এর মধ্যে দাও`,
      event.threadID,
      event.messageID
    );
  }

  const start = (page - 1) * ITEMS_PER_PAGE;
  const cmds = allCmds.slice(start, start + ITEMS_PER_PAGE);

  let msg = `╭───✦ Local Cmd Store ✦───╮
│ Page ${page}/${totalPages}
│ Total Commands: ${allCmds.length}
│
`;

  cmds.forEach((cmd, i) => {
    msg += `│ ${start + i + 1}. ${cmd.config.name}
│    Author: ${cmd.config.author || "Unknown"}
│    Category: ${cmd.config.category || "N/A"}
│
`;
  });

  msg += `╰─────────────⧕
Reply with a number to see details`;

  api.sendMessage(msg, event.threadID, (err, info) => {
    global.GoatBot.onReply.set(info.messageID, {
      commandName: this.config.name,
      author: event.senderID,
      cmds: allCmds,
      page
    });
  }, event.messageID);
};

module.exports.onReply = async function ({ api, event, Reply }) {
  if (Reply.author !== event.senderID)
    return api.sendMessage("Who are you? 🐸", event.threadID);

  const reply = parseInt(event.body);
  const start = (Reply.page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;

  if (isNaN(reply) || reply < start + 1 || reply > Reply.cmds.length) {
    return api.sendMessage(
      `❌ | ${start + 1} - ${Math.min(end, Reply.cmds.length)} এর মধ্যে নাম্বার দাও`,
      event.threadID
    );
  }

  const cmd = Reply.cmds[reply - 1].config;

  const msg = `╭───────⭓
│ Command: ${cmd.name}
│ Author: ${cmd.author || "Unknown"}
│ Role: ${cmd.role}
│ Category: ${cmd.category}
│ Description: ${cmd.description?.en || "No description"}
╰─────────────⭓`;

  api.sendMessage(msg, event.threadID, event.messageID);
};
