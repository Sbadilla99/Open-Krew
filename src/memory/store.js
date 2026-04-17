// src/memory/store.js
// Memoria persistente — guarda el historial entre sesiones
// Usa un archivo JSON simple (SQLite en v2)

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KREW_DIR = join(process.env.HOME || "~", ".krew");
const MEMORY_FILE = join(KREW_DIR, "memory.json");
const CONFIG_FILE = join(KREW_DIR, "config.json");

// Asegura que el directorio .krew existe
function ensureDir() {
  if (!existsSync(KREW_DIR)) {
    mkdirSync(KREW_DIR, { recursive: true });
  }
}

// ── Memory Store ──────────────────────────────────────────────────────

export class MemoryStore {
  constructor() {
    ensureDir();
    this.data = this.load();
  }

  load() {
    if (!existsSync(MEMORY_FILE)) {
      return { sessions: {}, facts: [], lastUpdated: null };
    }
    try {
      return JSON.parse(readFileSync(MEMORY_FILE, "utf-8"));
    } catch {
      return { sessions: {}, facts: [], lastUpdated: null };
    }
  }

  save() {
    this.data.lastUpdated = new Date().toISOString();
    writeFileSync(MEMORY_FILE, JSON.stringify(this.data, null, 2));
  }

  // Guarda mensajes de una sesión
  saveSession(chatId, messages) {
    if (!this.data.sessions[chatId]) {
      this.data.sessions[chatId] = [];
    }
    // Guarda las últimas 100 sesiones por chat
    const all = [...this.data.sessions[chatId], ...messages];
    this.data.sessions[chatId] = all.slice(-100);
    this.save();
  }

  // Carga el historial de una sesión
  loadSession(chatId) {
    return this.data.sessions[chatId] || [];
  }

  // Guarda un "hecho" que el usuario quiere que el krew recuerde
  // Ej: "My name is Sebas", "I work on MyAIgency"
  saveFact(fact) {
    this.data.facts.push({
      text: fact,
      timestamp: new Date().toISOString(),
    });
    this.save();
  }

  // Retorna todos los hechos como contexto para los agentes
  getFactsAsContext() {
    if (this.data.facts.length === 0) return "";
    return "What you know about the user:\n" +
      this.data.facts.map((f) => `- ${f.text}`).join("\n");
  }

  // Limpia el historial de una sesión (no los facts)
  clearSession(chatId) {
    this.data.sessions[chatId] = [];
    this.save();
  }

  // Limpia todo
  clearAll() {
    this.data = { sessions: {}, facts: [], lastUpdated: null };
    this.save();
  }
}

// ── Config Store ──────────────────────────────────────────────────────

export class ConfigStore {
  constructor() {
    ensureDir();
    this.data = this.load();
  }

  load() {
    if (!existsSync(CONFIG_FILE)) return null;
    try {
      return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
    } catch {
      return null;
    }
  }

  save(config) {
    this.data = config;
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  }

  get() {
    return this.data;
  }

  isConfigured() {
    return !!this.data?.telegram?.botToken;
  }
}
