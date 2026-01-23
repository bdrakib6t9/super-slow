/**
 * @author NTKhang
 * ! Official source code: https://github.com/ntkhang03/Goat-Bot-V2
 * ! Do not remove author credit
 */

const { spawn } = require("child_process");
const log = require("./logger/log.js");

let child;
let lastHeartbeat = Date.now();

/* =========================
   GLOBAL NETWORK ERROR GUARD
========================= */
process.on("uncaughtException", err => {
	if (
		err?.code === "ECONNRESET" ||
		String(err).includes("ECONNRESET")
	) {
		log.warn("⚠️ ECONNRESET ignored (network issue)");
		return;
	}
	log.err("UNCAUGHT_EXCEPTION", err);
});

process.on("unhandledRejection", err => {
	if (
		err?.code === "ECONNRESET" ||
		String(err).includes("ECONNRESET")
	) {
		log.warn("⚠️ ECONNRESET ignored (network issue)");
		return;
	}
	log.err("UNHANDLED_REJECTION", err);
});
/* ========================= */

function startProject() {
	log.info("🚀 Starting Goat Bot...");

	child = spawn("node", ["Goat.js"], {
		cwd: __dirname,
		stdio: ["inherit", "inherit", "inherit", "ipc"],
		shell: true
	});

	child.on("message", msg => {
		if (msg === "heartbeat") {
			lastHeartbeat = Date.now();
		}
	});

	child.on("close", code => {
		log.warn(`⚠️ Goat Bot exited with code ${code}`);
		setTimeout(startProject, 3000);
	});
}

/* =========================
   HEARTBEAT WATCHDOG
========================= */
setInterval(() => {
	if (Date.now() - lastHeartbeat > 1000 * 60 * 5) {
		log.warn("⚠️ Heartbeat lost, restarting bot...");
		if (child) child.kill();
	}
}, 1000 * 60);
/* ========================= */

startProject();
