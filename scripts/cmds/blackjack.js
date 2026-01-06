const utils = require("../../utils.js");
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ===== CARD SYSTEM ===== */
const suits = ["♠️", "♥️", "♦️", "♣️"];
const values = [
  { n: "A", v: [1, 11] }, { n: "2", v: [2] }, { n: "3", v: [3] },
  { n: "4", v: [4] }, { n: "5", v: [5] }, { n: "6", v: [6] },
  { n: "7", v: [7] }, { n: "8", v: [8] }, { n: "9", v: [9] },
  { n: "10", v: [10] }, { n: "J", v: [10] },
  { n: "Q", v: [10] }, { n: "K", v: [10] }
];

function drawCard() {
  const v = values[Math.floor(Math.random() * values.length)];
  const s = suits[Math.floor(Math.random() * suits.length)];
  return { name: `${v.n}${s}`, val: v.v };
}

function handValue(hand) {
  let totals = [0];
  for (const c of hand) {
    const next = [];
    for (const t of totals)
      for (const v of c.val)
        next.push(t + v);
    totals = next;
  }
  const ok = totals.filter(t => t <= 21);
  return ok.length ? Math.max(...ok) : Math.min(...totals);
}

module.exports = {
  config: {
    name: "blackjack",
    aliases: ["bj"],
    version: "2.1",
    author: "Rakib",
    role: 0,
    category: "economy"
  },

  onStart: async function ({ api, message, event, args, usersData }) {
    const uid = event.senderID;
    const user = await usersData.get(uid) || {};
    const data = user.data || {};
    const name = user.name || "Unknown";
    const isVIP = data.vip === true;

    /* ===== COOLDOWN ===== */
    const now = Date.now();
    if (now - (data.lastBJ || 0) < 10_000)
      return message.reply("⏳ Wait before playing again.");

    /* ===== LOAD BALANCES (SAFE) ===== */
    let wallet = utils.safeBigInt(user.money);
    let bank   = utils.safeBigInt(data.bank);

    /* ===== BET ===== */
    const bet = utils.parseAmount(
      args[0],
      "wallet",
      wallet,
      bank,
      0n
    );

    if (!bet || typeof bet !== "bigint" || bet <= 0n)
      return message.reply("❌ Invalid bet.");

    if (wallet < bet)
      return message.reply("❌ Not enough balance.");

    /* ===== DEAL ===== */
    const player = [drawCard(), drawCard()];
    const dealer = [drawCard(), drawCard()];

    const msg = await message.reply("🃏 Dealing cards...");
    await sleep(600);

    api.editMessage(
      `🃏 BLACKJACK\n\n` +
      `👤 Player: ${player.map(c => c.name).join(", ")}\n` +
      `🎯 Total: ${handValue(player)}\n\n` +
      `🤖 Dealer: ${dealer[0].name}, ❓`,
      msg.messageID
    );

    /* ===== DEALER TURN ===== */
    await sleep(800);
    while (handValue(dealer) < 17) dealer.push(drawCard());

    const p = handValue(player);
    const d = handValue(dealer);

    let profit = -bet;
    let result = "";

    if (p > 21) {
      result = "💀 BUST! You lose.";
    }
    else if (p === 21 && player.length === 2) {
      profit = isVIP ? bet * 3n : bet * 2n;
      wallet += profit;
      result = isVIP ? "💎 VIP BLACKJACK! x3 WIN!" : "💎 BLACKJACK! x2 WIN!";
    }
    else if (d > 21 || p > d) {
      profit = isVIP ? bet * 3n / 2n : bet;
      wallet += profit;
      result = isVIP ? "💎 VIP WIN! +50% bonus!" : "🎉 You win!";
    }
    else if (p === d) {
      profit = 0n;
      result = "🤝 Push! Bet returned.";
    }
    else {
      result = "💀 Dealer wins!";
    }

    if (profit < 0n) wallet -= bet;

    /* ===== AUTO BANK LIMIT (150cs SYSTEM) ===== */
    const fixed = utils.applyWalletLimit(wallet, bank);
    wallet = fixed.wallet;
    bank   = fixed.bank;

    /* ===== SAVE STATS ===== */
    const bjStats = data.bjStats || { win: 0, lose: 0 };
    if (profit > 0n) bjStats.win++;
    else if (profit < 0n) bjStats.lose++;

    await usersData.set(uid, {
      ...user,
      money: wallet.toString(),
      data: {
        ...data,
        bank: bank.toString(),
        lastBJ: now,
        bjStats
      }
    });

    /* ===== FINAL MESSAGE ===== */
    let out =
      `🃏 BLACKJACK RESULT\n\n` +
      `👤 Player: ${player.map(c => c.name).join(", ")}\n` +
      `🎯 Total: ${p}\n\n` +
      `🤖 Dealer: ${dealer.map(c => c.name).join(", ")}\n` +
      `🎯 Total: ${d}\n\n` +
      `${result}\n\n` +
      `💵 Bet: ${utils.formatMoney(bet)}\n`;

    if (profit > 0n)
      out += `💰 Win: +${utils.formatMoney(profit)}\n`;
    else if (profit < 0n)
      out += `💸 Loss: -${utils.formatMoney(-profit)}\n`;
    else
      out += `💰 Returned: ${utils.formatMoney(bet)}\n`;

    out +=
      (isVIP ? "👑 VIP Player\n" : "") +
      `💼 Wallet: ${utils.formatMoney(wallet)}\n` +
      `🏦 Bank: ${utils.formatMoney(bank)}`;

    api.editMessage(out, msg.messageID);
  }
};
