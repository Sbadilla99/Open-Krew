// src/core/pipelines/web.js
import { chatgptAgent } from "../../agents/chatgpt.js";
import { claudeAgent } from "../../agents/claude.js";
import { netlifyConnector } from "../../connectors/netlify.js";

export async function runWebPipeline({ userMessage, onStatus, previousCode = null, previousSiteId = null }) {
  await onStatus("🟢 *ChatGPT* is analyzing your request...");

  const chatgptPrompt = previousCode
    ? `Product Manager brief for modifying a webpage.\nUser request: "${userMessage}"\nExplain exactly what to change. Max 150 words.`
    : `Product Manager brief for building a webpage.\nUser request: "${userMessage}"\nInclude: sections, colors (hex), typography, copy for each section. Max 300 words.`;

  const brief = await chatgptAgent.respondRaw([{ role: "user", content: chatgptPrompt }]);

  await onStatus("🟡 *Claude* is writing the code...");

  const claudePrompt = previousCode
    ? `Senior frontend developer modifying a webpage.\nBRIEF: ${brief}\nEXISTING CODE: ${previousCode}\nReturn COMPLETE modified HTML. RULES:\n- Start <!DOCTYPE html>\n- ONLY raw HTML, no markdown, no fences\n- ONLY Tailwind classes, NO <style> tags, NO inline style=\n- Double quotes on all attributes`
    : `Senior frontend developer building a stunning webpage.\nBRIEF: ${brief}\nReturn COMPLETE HTML. RULES:\n- Start <!DOCTYPE html>, nothing before or after </html>\n- ONLY raw HTML, no markdown, no backtick fences\n- ONLY Tailwind classes, NO <style> tags, NO inline style= ANYWHERE\n- Include <script src="https://cdn.tailwindcss.com"></script> in head\n- Include Google Fonts CDN\n- Real copy, NO placeholders\n- All sections: hero, features, testimonials, pricing, CTA, footer\n- Stunning design with Tailwind only\n- Emoji instead of SVG icons\n- Double quotes on all attributes`;

  const rawCode = await claudeAgent.respondRaw([{ role: "user", content: claudePrompt }]);
  let code = rawCode.replace(/```html\n?/gi, "").replace(/```\n?/gi, "").replace(/^(Here|I've|Below).*\n?/gi, "").trim();
  if (!code.startsWith("<!DOCTYPE")) {
    const idx = code.indexOf("<!DOCTYPE");
    if (idx > -1) code = code.slice(idx);
  }

  await onStatus("🌐 *Netlify* is deploying your page...");
  const result = previousSiteId ? await netlifyConnector.updateSite(previousSiteId, code) : await netlifyConnector.deployHTML(code);
  if (result.success) return { success: true, url: result.url, code, siteId: result.siteId };
  return { success: false, error: result.error };
}
