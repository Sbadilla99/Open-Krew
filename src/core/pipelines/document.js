// src/core/pipelines/document.js
import { chatgptAgent } from "../../agents/chatgpt.js";
import { claudeAgent } from "../../agents/claude.js";

export async function runDocumentPipeline({ userMessage, onStatus }) {
  await onStatus("🟢 *ChatGPT* is structuring the document...");

  const structure = await chatgptAgent.respondRaw([{
    role: "user",
    content: `You are a senior document specialist. The user wants: "${userMessage}"
Create a detailed outline and key points for this document. Include all sections, main arguments, and specific content to include. Max 300 words.`
  }]);

  await onStatus("🟡 *Claude* is writing the content...");

  const content = await claudeAgent.respondRaw([{
    role: "user",
    content: `You are an expert writer. Write a complete, professional document based on this outline:

${structure}

Original request: "${userMessage}"

Rules:
- Write the full document, not an outline
- Use proper formatting with headers and sections
- Be specific and detailed
- Professional tone
- Include all sections from the outline`
  }]);

  return { success: true, content, type: "document" };
}
