// src/core/pipeline.js — v2.0 Orchestrator
import { route, PIPELINE_TYPES } from "./router.js";
import { runWebPipeline } from "./pipelines/web.js";
import { runDocumentPipeline } from "./pipelines/document.js";
import { runCodePipeline } from "./pipelines/code.js";
import { runResearchPipeline } from "./pipelines/research.js";
import { runTranslatePipeline } from "./pipelines/translate.js";

// Version history per chat
const versionHistory = new Map();

function getVersions(chatId) {
  if (!versionHistory.has(chatId)) versionHistory.set(chatId, []);
  return versionHistory.get(chatId);
}

function saveVersion(chatId, data) {
  const versions = getVersions(chatId);
  versions.push({ id: versions.length + 1, ...data, timestamp: new Date().toISOString() });
}

export function getLastVersion(chatId) {
  const versions = getVersions(chatId);
  return versions.length > 0 ? versions[versions.length - 1] : null;
}

export function listVersions(chatId) {
  return getVersions(chatId);
}

// Main orchestrator
export async function runPipeline({ userMessage, chatId, onStatus, onRoute }) {
  // Detect if it's a change request for the last web deploy
  const lastVersion = getLastVersion(chatId);
  const isChange = lastVersion?.type === "web" && isChangeRequest(userMessage);

  // Route the message
  const pipelineType = isChange ? PIPELINE_TYPES.WEB : await route(userMessage);

  // Notify what pipeline is running
  if (onRoute) await onRoute(pipelineType);

  let result;

  switch (pipelineType) {
    case PIPELINE_TYPES.WEB:
      result = await runWebPipeline({
        userMessage,
        onStatus,
        previousCode: isChange ? lastVersion.code : null,
        previousSiteId: isChange ? lastVersion.siteId : null,
      });
      if (result.success) {
        saveVersion(chatId, { type: "web", code: result.code, url: result.url, siteId: result.siteId, description: userMessage });
        const versions = getVersions(chatId);
        result.version = versions.length;
      }
      break;

    case PIPELINE_TYPES.DOCUMENT:
      result = await runDocumentPipeline({ userMessage, onStatus });
      if (result.success) saveVersion(chatId, { type: "document", content: result.content, description: userMessage });
      break;

    case PIPELINE_TYPES.CODE:
      result = await runCodePipeline({ userMessage, onStatus });
      if (result.success) saveVersion(chatId, { type: "code", content: result.content, description: userMessage });
      break;

    case PIPELINE_TYPES.RESEARCH:
      result = await runResearchPipeline({ userMessage, onStatus });
      if (result.success) saveVersion(chatId, { type: "research", content: result.content, description: userMessage });
      break;

    case PIPELINE_TYPES.TRANSLATE:
      result = await runTranslatePipeline({ userMessage, onStatus });
      if (result.success) saveVersion(chatId, { type: "translate", content: result.content, description: userMessage });
      break;

    default:
      result = { success: false, type: "chat" };
  }

  result.pipelineType = pipelineType;
  return result;
}

function isChangeRequest(message) {
  const triggers = ["change", "update", "modify", "fix", "add", "remove", "make it", "make the", "cambia", "actualiza", "modifica", "arregla", "agrega", "quita", "pon", "color", "font", "text", "button", "section"];
  return triggers.some(t => message.toLowerCase().includes(t));
}
