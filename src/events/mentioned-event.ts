import { Message } from "discord.js";

// Estado em memória por usuário para respostas progressivas e silêncio
type MentionState = {
  count: number;
  lastReset: number;
  cooldownUntil?: number;
};
const mentionState = new Map<string, MentionState>();

// Configurações de progressão e silêncio
const MENTION_RESET_MS = 30 * 60 * 1000; // 30 minutos sem mencionar reseta o progresso
const IRRITATION_THRESHOLD = 5; // a partir daqui o tom fica mais irritado
const SILENCE_THRESHOLD = 7; // ao atingir este número, silencia
const SILENCE_MS = 15 * 60 * 1000; // silêncio por 15 minutos

const tier1 = [
  "☕ Opa! Me chamou? Posso ajudar, é só dizer.",
  "😊 Aqui! Se quiser, testa `/ping` pra ver se estou ligado.",
  "📚 Dica rápida: mencione seu assunto e eu tento ajudar.",
  "📝 Me diga do que precisa e eu tento resolver.",
  "💬 Estou por aqui! Como posso ajudar?",
];
const tier2 = [
  "🙂 Opa, de novo! Conta mais sobre o que você precisa.",
  "🔎 Se busca algo específico, descreve que eu te ajudo.",
  "🙃 Me mencionou de novo! Qual é a dúvida?",
  "🎯 Vamos lá! Qual é o objetivo?",
];
const tier3 = [
  "😅 Tá ficando frequente, hein? Vamos focar no assunto?",
  "🤖 Gosto de atenção, mas me diga exatamente o que você precisa.",
  "🧭 Bora focar! Me explica melhor sua ideia.",
  "📌 Se puder, manda um contexto mais completo.",
];
const tier4 = [
  "⚠️ Muitas menções… vamos evitar spam? Traz sua pergunta clara 🙂",
  "⏳ Calma lá! Respondo melhor com uma pergunta ou contexto objetivo.",
  "🗂️ Organiza o pedido e eu ajudo rapidinho.",
];
const tier5 = [
  "😤 Ei… você tá me mencionando demais. Fala direto o que precisa.",
  "🙇 Ok, estou ficando irritado. Vamos com calma e objetividade.",
  "🚫 Chegando no limite… evite me chamar sem necessidade, por favor.",
];
const silenceNotice = [
  "🔇 Beleza… vou te silenciar por 15 minutos. Volte depois.",
  "🛑 Chega por agora. Silenciei por 15 min, depois você volta.",
  "🕰️ Pausa: 15 minutos de silencio para você. Até já.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function handleMention(message: Message) {
  try {
    if (message.author.bot) return;

    const botId = message.client.user?.id;
    if (!botId) return;

    const isMentioned = message.mentions.users.has(botId);
    if (!isMentioned) return;

    // O handler de menção só deve responder quando a menção ao bot for isolada,
    // sem outras palavras/frases. Se houver conteúdo adicional, delega para outros handlers.
    const contentWithoutBot = message.content
      .replace(new RegExp(`<@!?${botId}>`, "g"), "")
      .trim();
    if (contentWithoutBot.length > 0) {
      return;
    }

    const userId = message.author.id;
    const now = Date.now();
    const state = mentionState.get(userId);

    // Se o usuário está silenciado, não responde
    if (state?.cooldownUntil && now < state.cooldownUntil) {
      return;
    }

    if (!state || now - state.lastReset > MENTION_RESET_MS) {
      mentionState.set(userId, { count: 1, lastReset: now });
    } else {
      state.count += 1;
      state.lastReset = now;
      mentionState.set(userId, state);
    }

    const current = mentionState.get(userId)!;
    const count = current.count;

    // Se atingiu o limite de silêncio, avisa e inicia cooldown
    if (count >= SILENCE_THRESHOLD) {
      current.cooldownUntil = now + SILENCE_MS;
      mentionState.set(userId, current);
      const reply = pick(silenceNotice);
      await message.reply({ content: reply });
      return;
    }

    let reply: string;
    if (count <= 2) reply = pick(tier1);
    else if (count <= 4) reply = pick(tier2);
    else if (count === IRRITATION_THRESHOLD) reply = pick(tier5);
    else if (count >= 5) reply = pick(tier4);
    else reply = pick(tier3);

    await message.reply({ content: reply });
  } catch (_) {
    // silencioso para não poluir logs
  }
}
