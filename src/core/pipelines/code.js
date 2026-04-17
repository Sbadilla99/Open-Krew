// src/core/pipelines/code.js
import { claudeAgent } from "../../agents/claude.js";

export async function runCodePipeline({ userMessage, onStatus }) {
  await onStatus("🟡 *Claude* is writing the code...");

  const code = await claudeAgent.respondRaw([{
    role: "user",
    content: `You are a senior developer. The user wants: "${userMessage}"

Write clean, production-ready code. Include:
- Comments explaining key parts
- Error handling where appropriate
- Usage example at the end

Return the code with proper markdown formatting using code blocks.`
  }]);

  return { success: true, content: code, type: "code" };
}
