const utils = require("../../utils.js");
const sleep = ms => new Promise(r => setTimeout(r, ms));

const MOVES = {
  rock: "✊",
  paper: "✋",
  scissors: "✌️"
};
const MOVE_KEYS = Object.keys(MOVES);

function parseMove(input) {
  if (!input) return null;
  const t = String(input).toLowerCase();
  if (["rock","r","✊"].includes(t)) return "rock";
  if (["paper","p","✋"].includes(t)) return "paper";
  if (["scissors","s","✌","✌️"].includes(t)) return "scissors";
  return null;
}

function decide(a, b) {
  if (a === b) return "tie";
  if (
    (a === "rock" && b === "scissors") ||
    (a === "scissors" && b === "paper") ||
    (a === "paper" && b === "rock")
  ) return "win";
  return "lose";
}

module.exports = {
  config: {
    name: "rps",
    aliases: ["rockpaperscissors"],
    version: "4.0",
    author: "Rakib",
    role: 0,
    category: "economy"
  },

  onStart: async function ({ api, message, event, args, usersData }) {
    const uid = event.senderID;
    const user = await usersData.get(uid) || {};
    const data = user.data || {};
    const name = user.name || "Unknown";

    /* ===== COOLDOWN ===== */
    const now = Date.now();
    if (now - (data.lastRPS || 0) < 5000)
      return message.reply("⏳ Wait before playing again.");

    /* ===== BALANCE ===== */
    let wallet = utils.safeBigInt(user.money);
    let bank   = utils.safeBigInt(data.bank);

    /* ===== BET ===== */
    const bet = utils.parseAmount(args[0], "wallet", wallet, bank, 0n);
    const move = parseMove(args[1]);

    if (!bet || bet <= 0n || !move)
      return message.reply("❌ Use: rps <amount> <✊|✋|✌️>");

    if (wallet < bet)
      return message.reply(`❌ Not enough balance.\nBalance: ${utils.formatMoney(wallet)}`);

    /* ===== BOT MOVE ===== */
    const botMove = MOVE_KEYS[Math.floor(Math.random() * 3)];
    const result = decide(move, botMove);

    /* ===== RESULT CALC ===== */
    let profit = 0n;
    let title = "";
    let line = "";

    if (result === "win") {
      profit = bet;
      wallet += bet;
      title = "🎉 YOU WIN!";
      line = `💰 Win: +${utils.formatMoney(bet)}`;
    }
    else if (result === "lose") {
      profit = -bet;
      wallet -= bet;
      title = "💀 YOU LOSE!";
      line = `💸 Loss: -${utils.formatMoney(bet)}`;
    }
    else {
      title = "🔁 DRAW!";
      line = "➖ No win, no loss";
    }

    /* ===== AUTO BANK LIMIT ===== */
    const fixed = utils.applyWalletLimit(wallet, bank);
    wallet = fixed.wallet;
    bank   = fixed.bank;

    /* ===== SAVE ===== */
    await usersData.set(uid, {
      ...user,
      money: wallet.toString(),
      data: {
        ...data,
        bank: bank.toString(),
        lastRPS: now,
        rpsStats: {
          plays: (data.rpsStats?.plays || 0) + 1,
          wins: (data.rpsStats?.wins || 0) + (result === "win" ? 1 : 0),
          losses: (data.rpsStats?.losses || 0) + (result === "lose" ? 1 : 0),
          ties: (data.rpsStats?.ties || 0) + (result === "tie" ? 1 : 0)
        }
      }
    });

    /* ===== INITIAL MESSAGE ===== */
    const sent = await message.reply(
      `🎮 RPS GAME\n\n` +
      `❓ VS ❓\n` +
      `✨ Choosing moves...\n\n` +
      `👤 Player: ${name}\n` +
      `💵 Bet: ${utils.formatMoney(bet)}`
    );

    /* ===== ANIMATION (3 edits) ===== */
    for (let i = 0; i < 3; i++) {
      await sleep(400);
      api.editMessage(
        `🎮 RPS GAME\n\n` +
        `${MOVES[MOVE_KEYS[Math.floor(Math.random()*3)]]} VS ${MOVES[MOVE_KEYS[Math.floor(Math.random()*3)]]}\n` +
        `✨ Choosing moves...\n\n` +
        `👤 Player: ${name}\n` +
        `💵 Bet: ${utils.formatMoney(bet)}`,
        sent.messageID
      );
    }

    /* ===== FINAL RESULT ===== */
    await sleep(500);
    api.editMessage(
      `🎮 RPS RESULT\n\n` +
      `${MOVES[move]} VS ${MOVES[botMove]}\n\n` +
      `${title}\n` +
      `${line}\n\n` +
      `👤 Player: ${name}\n` +
      `💼 Wallet: ${utils.formatMoney(wallet)}\n` +
      `🏦 Bank: ${utils.formatMoney(bank)}`,
      sent.messageID
    );
  }
};
