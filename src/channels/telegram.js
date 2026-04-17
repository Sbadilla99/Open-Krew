// src/channels/telegram.js — v2.0
import { Telegraf } from "telegraf";
import { Krew } from "../core/krew.js";
import { runPipeline, getLastVersion, listVersions } from "../core/pipeline.js";
import { PIPELINE_TYPES } from "../core/router.js";

const MAX = 4000;

async function sendSafe(bot, chatId, text) {
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) { chunks.push(remaining.slice(0, MAX)); remaining = remaining.slice(MAX); }
  for (const chunk of chunks) {
    try { await bot.telegram.sendMessage(chatId, chunk, { parse_mode: "Markdown" }); }
    catch { try { await bot.telegram.sendMessage(chatId, chunk); } catch {} }
  }
}

// Pipeline type labels
const PIPELINE_LABELS = {
  [PIPELINE_TYPES.WEB]:       "🌐 Web builder activated",
  [PIPELINE_TYPES.DOCUMENT]:  "📄 Document writer activated",
  [PIPELINE_TYPES.CODE]:      "💻 Code writer activated",
  [PIPELINE_TYPES.RESEARCH]:  "🔍 Research mode activated",
  [PIPELINE_TYPES.TRANSLATE]: "🌍 Translator activated",
};

export function createTelegramChannel() {
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
  const krews = new Map();
  const building = new Set();

  function getKrew(chatId) {
    if (!krews.has(chatId)) {
      const krew = new Krew({
        chatId: String(chatId),
        onMessage: async ({ agent, text }) => {
          await sendSafe(bot, chatId, `${agent.emoji} *${agent.name.toUpperCase()}*\n${text}`);
        },
      });
      krews.set(chatId, krew);
    }
    return krews.get(chatId);
  }

  bot.start(async (ctx) => {
    const { members } = getKrew(ctx.chat.id).status();
    const name = ctx.from.first_name || "there";
    await sendSafe(bot, ctx.chat.id,
      `🤝 *Welcome to OpenKrew, ${name}!*\n\n` +
      `Your AI krew can handle anything you throw at them.\n\n` +
      `*Active members:*\n${members.map(m => `${m.emoji} ${m.name}`).join("\n")}\n\n` +
      `*Try it:*\n` +
      `🌐 _"Build a landing page for PayFast"_\n` +
      `📄 _"Write a business plan for a SaaS startup"_\n` +
      `💻 _"Write a Python script to scrape prices"_\n` +
      `🔍 _"Analyze the best payment processors in LATAM"_\n` +
      `🌍 _"Translate this contract to Spanish"_\n\n` +
      `/help — all commands`
    );
  });

  bot.command("versions", async (ctx) => {
    const versions = listVersions(String(ctx.chat.id));
    if (versions.length === 0) return sendSafe(bot, ctx.chat.id, "No tasks completed yet. Ask me anything!");
    const list = versions.map(v => {
      const icon = { web: "🌐", document: "📄", code: "💻", research: "🔍", translate: "🌍" }[v.type] || "📌";
      const extra = v.url ? `\n🔗 ${v.url}` : "";
      return `${icon} *v${v.id}* — ${v.description.slice(0, 50)}${extra}`;
    }).join("\n\n");
    await sendSafe(bot, ctx.chat.id, `*📦 Your history:*\n\n${list}`);
  });

  bot.command("new", async (ctx) => {
    getKrew(ctx.chat.id).reset();
    await sendSafe(bot, ctx.chat.id, "🔄 *Fresh start.* What do you need?");
  });

  bot.command("krew", async (ctx) => {
    const { members, messageCount } = getKrew(ctx.chat.id).status();
    await sendSafe(bot, ctx.chat.id,
      `*🤝 Your Krew*\n\n` + members.map(m => `${m.emoji} *${m.name}*`).join("\n") +
      `\n\n💬 ${messageCount} messages this session`
    );
  });

  bot.command("help", async (ctx) => {
    await sendSafe(bot, ctx.chat.id,
      `*🤝 OpenKrew v2.0*\n\n` +
      `Your krew handles any task:\n\n` +
      `🌐 *Web* — build or modify webpages\n` +
      `📄 *Documents* — reports, plans, emails, contracts\n` +
      `💻 *Code* — scripts, functions, automation\n` +
      `🔍 *Research* — analysis, comparisons, insights\n` +
      `🌍 *Translate* — any language\n\n` +
      `*Commands:*\n` +
      `/versions — task history\n` +
      `/krew — active members\n` +
      `/new — fresh start\n` +
      `/help — this message`
    );
  });

  bot.on("text", async (ctx) => {
    if (ctx.message.text.startsWith("/")) return;
    const chatId = String(ctx.chat.id);
    const message = ctx.message.text;

    if (building.has(chatId)) {
      return sendSafe(bot, ctx.chat.id, "⏳ Still working on your previous request...");
    }

    building.add(chatId);
    await ctx.sendChatAction("typing");

    try {
      const result = await runPipeline({
        userMessage: message,
        chatId,
        onRoute: async (type) => {
          if (type !== PIPELINE_TYPES.CHAT && PIPELINE_LABELS[type]) {
            await sendSafe(bot, ctx.chat.id, PIPELINE_LABELS[type]);
          }
        },
        onStatus: async (status) => {
          await sendSafe(bot, ctx.chat.id, status);
          await ctx.sendChatAction("typing");
        },
      });

      // Handle results by type
      if (result.pipelineType === PIPELINE_TYPES.CHAT || !result.success && result.type === "chat") {
        // Fall through to group chat
        building.delete(chatId);
        const krew = getKrew(chatId);
        try { await krew.chat(message, "user"); } catch {}
        return;
      }

      if (!result.success) {
        await sendSafe(bot, ctx.chat.id, `❌ Error: ${result.error || "Something went wrong"}`);
        return;
      }

      // Web result
      if (result.pipelineType === PIPELINE_TYPES.WEB) {
        await sendSafe(bot, ctx.chat.id,
          `✅ *Deployed and live!*\n\n🔗 ${result.url}\n\n_v${result.version} — permanent URL_\n\nWant changes? Just tell me what to modify.`
        );
        return;
      }

      // Text results (document, code, research, translate)
      if (result.content) {
        await sendSafe(bot, ctx.chat.id, result.content);
        return;
      }

    } catch (err) {
      await sendSafe(bot, ctx.chat.id, `❌ Error: ${err.message}`);
    } finally {
      building.delete(chatId);
    }
  });

  bot.catch((err) => console.error("Telegram error:", err));
  return bot;
}
