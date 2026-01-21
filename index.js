/**
 * @author NTKhang
 * Official source code: https://github.com/ntkhang03/Goat-Bot-V2
 */

const log = require("./logger/log.js");

/* =========================
   GLOBAL ERROR GUARD
========================= */
process.on("uncaughtException", err => {
	log.err("UNCAUGHT_EXCEPTION", err);
});

process.on("unhandledRejection", err => {
	log.err("UNHANDLED_REJECTION", err);
});
/* ========================= */

log.info("BOOT", "Starting Goat Bot (single-process mode)");

// 🚀 DIRECTLY START BOT (NO CHILD PROCESS)
require("./Goat.js");
