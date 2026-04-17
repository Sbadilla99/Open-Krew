// src/ui.js
import chalk from "chalk";

export const c = {
  red:   (t) => chalk.hex("#EF4444")(t),
  amber: (t) => chalk.hex("#F59E0B")(t),
  green: (t) => chalk.hex("#22C55E")(t),
  mint:  (t) => chalk.hex("#6EE7B7")(t),
  muted: (t) => chalk.hex("#6666AA")(t),
  white: (t) => chalk.hex("#EEEEF8")(t),
  bold:  (t) => chalk.bold(t),
};

export function printLogo() {
  console.clear();
  console.log("");
  // K
  const K = [
    "█╗ █╗",
    "██╔╝ ",
    "██╗  ",
    "╚██╗ ",
    "╚█╗ █",
  ];
  // R
  const R = [
    "██████╗ ",
    "██╔══██╗",
    "██████╔╝",
    "██╔══██╗",
    "██║  ██║",
  ];
  // E
  const E = [
    "███████╗",
    "██╔════╝",
    "█████╗  ",
    "██╔══╝  ",
    "███████╗",
  ];
  // W
  const W = [
    "██╗    ██╗",
    "██║    ██║",
    "██║ █╗ ██║",
    "██║███╗██║",
    "╚███╔███╔╝",
  ];

  const colors = [c.red, c.amber, c.green, c.mint];
  const letters = [K, R, E, W];

  for (let row = 0; row < 5; row++) {
    let line = "  ";
    letters.forEach((letter, i) => {
      line += colors[i](letter[row]) + " ";
    });
    console.log(line);
  }

  console.log("");
  console.log("  " + c.mint("●") + " " + c.white("Your AI krew. One chat."));
  console.log("");
  console.log("  " + c.muted("─".repeat(44)));
  console.log("");
}

export function printKrewArt() {
  console.log("");
  console.log("  " + c.red("[◉_◉]") + "──" + c.amber("[◉_◉]") + "──" + c.green("[◉_◉]"));
  console.log("  " + c.red(" /█\\ ") + "  " + c.amber(" /█\\ ") + "  " + c.green(" /█\\ "));
  console.log("  " + c.red(" / \\ ") + "  " + c.amber(" / \\ ") + "  " + c.green(" / \\ "));
  console.log("");
  console.log("  " + c.muted("Hold on tight — your krew is forming..."));
  console.log("");
}

export function divider() { console.log("  " + c.muted("─".repeat(44))); }

export function section(emoji, title) {
  console.log("");
  console.log("  " + emoji + "  " + c.white(c.bold(title)));
  console.log("");
}

export function success(msg) { console.log("  " + c.green("✓") + "  " + c.white(msg)); }
export function error(msg)   { console.log("  " + chalk.red("✗") + "  " + chalk.red(msg)); }
export function info(msg)    { console.log("  " + c.mint("›") + "  " + c.muted(msg)); }
export function warn(msg)    { console.log("  " + c.amber("⚠") + "  " + c.amber(msg)); }

export function agentStatus(emoji, name, color, active) {
  const colorFn = chalk.hex(color);
  const status = active ? colorFn("● active") : c.muted("○ not configured");
  console.log("  " + emoji + "  " + colorFn(name.padEnd(12)) + "  " + status);
}

export function printStartupBanner(agents) {
  printLogo();
  printKrewArt();
  console.log("  " + c.white(c.bold("Active krew members:")));
  console.log("");
  for (const a of agents) agentStatus(a.emoji, a.name, a.color, a.active);
  console.log("");
  divider();
  console.log("");
  console.log("  " + c.mint("🚀") + "  " + c.white(c.bold("OpenKrew is live.")));
  console.log("  " + c.muted("   Open Telegram and talk to your krew."));
  console.log("");
  console.log("  " + c.muted("   Press Ctrl+C to stop."));
  console.log("");
  divider();
  console.log("");
}

export function printSetupWelcome() {
  printLogo();
  console.log("  " + c.white(c.bold("Welcome to OpenKrew setup.")));
  console.log("");
  console.log("  " + c.muted("This wizard will connect your AI krew in ~2 minutes."));
  console.log("  " + c.muted("You'll need at least one AI API key to get started."));
  console.log("");
  divider();
}

export function printSetupComplete(activeAgents) {
  console.log(""); divider(); console.log("");
  printKrewArt();
  console.log("  " + c.green(c.bold("✓ Your krew is ready.")));
  console.log("");
  console.log("  " + c.muted("Active: ") + c.white(activeAgents.join(", ")));
  console.log("");
  console.log("  " + c.white("Run: ") + c.mint("npm start"));
  console.log(""); divider(); console.log("");
}

export function printGroupMessage(agent, text) {
  const colorFn = chalk.hex(agent.color || "#6EE7B7");
  console.log("");
  console.log("  " + agent.emoji + "  " + colorFn(c.bold(agent.name.toUpperCase())));
  console.log("  " + c.muted("   " + text.split("\n").join("\n     ")));
}

export function printUserMessage(text) {
  console.log("");
  console.log("  " + c.mint("You") + c.muted(" ›  ") + c.white(text));
}

export function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
