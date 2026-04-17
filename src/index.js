#!/usr/bin/env node
import "dotenv/config";
import { printStartupBanner, error } from "./ui.js";
import { createTelegramChannel } from "./channels/telegram.js";

async function main() {
  const agents = [
    { emoji: "🟡", name: "Claude",   color: "#D4A853", active: !!process.env.ANTHROPIC_API_KEY },
    { emoji: "🟢", name: "ChatGPT",  color: "#10B981", active: !!process.env.OPENAI_API_KEY },
    { emoji: "🔵", name: "Gemini",   color: "#60A5FA", active: !!process.env.GEMINI_API_KEY },
    { emoji: "🌐", name: "Netlify",  color: "#00C7B7", active: !!process.env.NETLIFY_TOKEN },
  ];

  printStartupBanner(agents);

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    error("TELEGRAM_BOT_TOKEN missing. Run: npm run setup");
    process.exit(1);
  }

  const bot = createTelegramChannel();
  process.once("SIGINT",  () => { console.log("\n"); bot.stop("SIGINT"); });
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
  await bot.launch();
}

main().catch(err => { error(err.message); process.exit(1); });
