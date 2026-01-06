const moment = require("moment-timezone");

const OWNER_ID = "61581351693349";

module.exports = {
  config: {
    name: "msgrequest",
    aliases: ["mr", "req"],
    version: "1.0",
    author: "Custom by ChatGPT",
    role: 2,
    shortDescription: "Control message requests (Owner only)",
    longDescription: "View, confirm or delete message/group requests",
    category: "Utility",
  },

  onStart: async function ({ event, api, commandName }) {
    if (event.senderID !== OWNER_ID) {
      return api.sendMessage(
        "❌ এই কমান্ডটি শুধু Bot Owner ব্যবহার করতে পারবেন।",
        event.threadID,
        event.messageID
      );
    }

    const form = {
      av: api.getCurrentUserID(),
      fb_api_req_friendly_name: "MessengerMessageRequestsRootQuery",
      fb_api_caller_class: "RelayModern",
      doc_id: "25618261841150840",
      variables: JSON.stringify({
        limit: 20,
        scale: 3
      })
    };

    let data;
    try {
      data = JSON.parse(
        await api.httpPost("https://www.facebook.com/api/graphql/", form)
      );
    } catch (e) {
      return api.sendMessage("❌ Failed to load message requests.", event.threadID);
    }

    const requests = data?.data?.viewer?.message_requests?.nodes || [];

    if (requests.length === 0) {
      return api.sendMessage("ℹ️ No pending message/group requests.", event.threadID);
    }

    let msg = "📩 Pending Message / Group Requests:\n";
    let i = 0;

    for (const r of requests) {
      i++;
      msg += `\n${i}. Name: ${r.thread?.name || "Unknown"}`
        + `\nThreadID: ${r.thread?.thread_key?.thread_fbid || "N/A"}`
        + `\nType: ${r.thread?.thread_type}`
        + `\nTime: ${moment(r.updated_time * 1000)
            .tz("Asia/Manila")
            .format("DD/MM/YYYY HH:mm:ss")}\n`;
    }

    api.sendMessage(
      `${msg}\nReply with:\nconfirm <number | all>\ndelete <number | all>`,
      event.threadID,
      (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          author: event.senderID,
          messageID: info.messageID,
          requests,
          unsendTimeout: setTimeout(() => {
            api.unsendMessage(info.messageID);
          }, 60 * 1000)
        });
      }
    );
  },

  onReply: async function ({ event, api, Reply }) {
    if (event.senderID !== OWNER_ID) return;

    const { author, requests, messageID } = Reply;
    if (author !== event.senderID) return;

    clearTimeout(Reply.unsendTimeout);

    const args = event.body.trim().toLowerCase().split(" ");
    const action = args[0];

    if (!["confirm", "delete"].includes(action)) {
      return api.sendMessage(
        "❌ Use: confirm <number|all> OR delete <number|all>",
        event.threadID
      );
    }

    let targets = args[1] === "all"
      ? requests.map((_, i) => i + 1)
      : args.slice(1).map(n => parseInt(n)).filter(Boolean);

    const success = [];
    const failed = [];

    for (const num of targets) {
      const req = requests[num - 1];
      if (!req) {
        failed.push(`Invalid number ${num}`);
        continue;
      }

      try {
        await api.handleMessageRequest(
          req.thread.thread_key.thread_fbid,
          action === "confirm" ? "accept" : "delete"
        );
        success.push(req.thread.name || "Unknown");
      } catch (e) {
        failed.push(req.thread.name || "Unknown");
      }
    }

    api.sendMessage(
      `✅ Success (${success.length}):\n${success.join("\n")}`
      + (failed.length ? `\n\n❌ Failed (${failed.length}):\n${failed.join("\n")}` : ""),
      event.threadID
    );

    api.unsendMessage(messageID);
  }
};
