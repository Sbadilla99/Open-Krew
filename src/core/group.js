// src/core/group.js
// El corazón de OpenKrew — el historial compartido del grupo
// Todos los AIs leen esto. Todos escriben aquí.

export class KrewGroup {
  constructor(groupId) {
    this.groupId = groupId;
    this.messages = [];        // historial completo del grupo
    this.members = new Map();  // agentes activos: id → agent instance
    this.isProcessing = false; // evita loops infinitos
    this.maxHistoryTokens = 6000; // límite de contexto por llamada
  }

  // Agrega un miembro al grupo
  addMember(agent) {
    this.members.set(agent.id, agent);
    console.log(`➕ ${agent.name} se unió al grupo`);
  }

  // Mensaje nuevo — de un humano o de un AI
  addMessage(from, text, role = "user") {
    const msg = {
      id: Date.now(),
      from,           // "user" | "claude" | "chatgpt" | "gemini"
      role,           // "user" | "assistant"
      text,
      timestamp: new Date().toISOString(),
    };
    this.messages.push(msg);
    return msg;
  }

  // Construye el contexto que cada AI va a recibir
  // Incluye el historial del grupo formateado como conversación
  buildContextFor(agentId) {
    // Comprimimos si hay demasiados mensajes
    const history = this.getCompressedHistory();

    // Formateamos el historial como mensajes de chat
    const formatted = history.map((msg) => {
      const isFromThisAgent = msg.from === agentId;
      const sender = msg.from === "user" ? "User" : msg.from.toUpperCase();

      return {
        role: isFromThisAgent ? "assistant" : "user",
        content: msg.from === "user"
          ? msg.text
          : `[${sender}]: ${msg.text}`,
      };
    });

    return formatted;
  }

  // Comprime el historial si es muy largo
  // Mantiene los últimos N mensajes completos + resumen de los anteriores
  getCompressedHistory() {
    const KEEP_LAST = 20;
    if (this.messages.length <= KEEP_LAST) return this.messages;

    // Por ahora retorna los últimos 20 — en v2 agregamos summarization
    return this.messages.slice(-KEEP_LAST);
  }

  // Detecta si un mensaje menciona a un agente específico
  // Ej: "@claude hacé esto" → activa solo Claude
  detectMentions(text) {
    const mentions = [];
    for (const [id] of this.members) {
      if (text.toLowerCase().includes(`@${id}`)) {
        mentions.push(id);
      }
    }
    return mentions;
  }

  // Decide qué agentes deben responder a este mensaje
  getRespondents(userMessage) {
    const mentions = this.detectMentions(userMessage);

    // Si hay menciones específicas, solo responden esos
    if (mentions.length > 0) {
      return mentions
        .map((id) => this.members.get(id))
        .filter(Boolean);
    }

    // Si no hay menciones, responden todos
    return Array.from(this.members.values());
  }

  // Limpia el historial (nuevo tema)
  reset() {
    this.messages = [];
    console.log("🔄 Historial del grupo limpiado");
  }
}
