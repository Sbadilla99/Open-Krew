// src/core/pipelines/translate.js
import { claudeAgent } from "../../agents/claude.js";

export async function runTranslatePipeline({ userMessage, onStatus }) {
  await onStatus("🟡 *Claude* is translating...");

  const result = await claudeAgent.respondRaw([{
    role: "user",
    content: `You are a professional translator. ${userMessage}

Provide:
1. The translation
2. Brief note on any nuances or alternative phrasings if relevant

Be accurate and natural.`
  }]);

  return { success: true, content: result, type: "translate" };
}
