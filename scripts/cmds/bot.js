const axios = require("axios");

const API_KEY = "rakib69";

const CHAT_API   = "https://rakib-api.vercel.app/api/simma-chat";
const AI_API     = "https://rakib-api.vercel.app/api/simma-ai";
const LISTEN_API = "https://rakib-api.vercel.app/api/simma-listen";

const triggers = ["hoon", "bot", "tessa", " kire", "hi", " hlw", "hello", "bby", "জানু", "বউ", "বট", "baby"];

module.exports.config = {
  name: "bot",
  aliases: triggers,
  version: "1.0",
  author: "Rakib",
  role: 0,
  category: "chat",
  guide: {
    en: "{pn} [message]"
  }
};

/* ================== HELPERS ================== */

async function getReplyFromAPI(url, text) {
  try {
    const res = await axios.get(url, {
      params: { text, apikey: API_KEY }
    });

    let reply =
      res.data?.reply ||
      res.data?.message ||
      res.data?.text ||
      res.data;

    if (!reply || typeof reply !== "string") return null;

    reply = reply.trim();
    if (
      reply.length < 2 ||
      reply.toLowerCase().includes("bujhte pari nai") ||
      reply.toLowerCase() === text.toLowerCase()
    ) {
      return null;
    }

    return reply;
  } catch {
    return null;
  }
}

/* ================== MAIN CHAT ================== */
async function chat(text) {
  // 1️⃣ try simma-chat
  let reply = await getReplyFromAPI(CHAT_API, text);
  if (reply) return reply;

  // 2️⃣ fallback to simma-ai
  reply = await getReplyFromAPI(AI_API, text);
  if (reply) return reply;

  // 3️⃣ nothing found
  return "eta teach kora nei, plz bby teach kore dau🥺";
}

/* ================== COMMAND START ================== */
module.exports.onStart = async ({ api, event, args }) => {
  const uid = event.senderID;
  const msg = args.join(" ").trim();

  const reply = msg ? await chat(msg) : "hmm bby 😽";

  api.sendMessage(reply, event.threadID, (err, info) => {
    if (!err) {
      global.GoatBot.onReply.set(info.messageID, {
        commandName: "bot",
        author: uid,
        text: reply
      });
    }
  }, event.messageID);
};

/* ================== REPLY CHAIN + AUTO TEACH ================== */
module.exports.onReply = async ({ api, event, Reply }) => {
  try {
    // only same user
    if (event.senderID !== Reply.author) return;

    const userReply = event.body;
    if (!userReply) return;

    const botMessage = Reply.text;
    if (!botMessage) return;

    // 🔥 AUTO TEACH
    axios.get(LISTEN_API, {
      params: {
        question: botMessage,
        reply: userReply,
        isReply: true,
        apikey: API_KEY
      }
    }).catch(() => {});

    // continue chat
    const reply = await chat(userReply);

    api.sendMessage(reply, event.threadID, (err, info) => {
      if (!err) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "bot",
          author: event.senderID,
          text: reply
        });
      }
    }, event.messageID);

  } catch (e) {
    console.error("Reply error:", e);
  }
};

/* ================== AUTO TRIGGER ================== */
module.exports.onChat = async ({ api, event }) => {
  try {
    const text = (event.body || "").trim();
    if (!text) return;

    const lower = text.toLowerCase();

    // trigger only
    if (triggers.includes(lower)) {
      api.sendMessage("hmm bby 😽", event.threadID, (err, info) => {
        if (!err) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: "bot",
            author: event.senderID,
            text: "hmm bby 😽"
          });
        }
      }, event.messageID);
      return;
    }

    // trigger + message
    for (const t of triggers) {
      if (lower.startsWith(t + " ")) {
        const userText = text.slice(t.length).trim();
        const reply = await chat(userText);

        api.sendMessage(reply, event.threadID, (err, info) => {
          if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName: "bot",
              author: event.senderID,
              text: reply
            });
          }
        }, event.messageID);
        return;
      }
    }
  } catch (e) {
    console.error("onChat error:", e);
  }
};
