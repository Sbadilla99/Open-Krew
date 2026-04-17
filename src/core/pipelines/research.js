// src/core/pipelines/research.js
import { chatgptAgent } from "../../agents/chatgpt.js";
import { claudeAgent } from "../../agents/claude.js";

export async function runResearchPipeline({ userMessage, onStatus }) {
  await onStatus("🟢 *ChatGPT* is gathering information...");

  const data = await chatgptAgent.respondRaw([{
    role: "user",
    content: `Research assistant. User request: "${userMessage}"
Provide comprehensive, factual information. Include key data points, examples, and context. Be thorough. Max 400 words.`
  }]);

  await onStatus("🟡 *Claude* is analyzing and structuring insights...");

  const analysis = await claudeAgent.respondRaw([{
    role: "user",
    content: `You are an expert analyst. Based on this research:

${data}

Original question: "${userMessage}"

Provide:
1. Key insights and takeaways
2. Structured analysis
3. Practical recommendations or conclusions
4. Any important caveats

Be clear, concise, and actionable.`
  }]);

  return { success: true, content: analysis, type: "research" };
}
