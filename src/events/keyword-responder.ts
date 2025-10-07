import { Message } from "discord.js";

// Responde a saudações e situações aleatórias, mencionando o autor
// Evita responder se a mensagem mencionar diretamente o bot (para não conflitar com handleMention)

const userCooldown = new Map<string, number>();
const COOLDOWN_MS = 2 * 60 * 1000; // 2 minutos por usuário

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function formatReply(message: Message, text: string): string {
  const name = message.member?.displayName ?? message.author.username;
  return `<@${message.author.id}> ${text.replace("{name}", name)}`;
}

const patterns = {
  morning: [/\bbom dia\b/, /\bgood morning\b/, /\bmorning\b/, /\botimo dia\b/],
  afternoon: [/\bboa tarde\b/, /\bgood afternoon\b/, /\bboa\s*tarde\b/],
  night: [/\bboa noite\b/, /\bgood night\b/, /\bgood evening\b/],
  madrugada: [/\bboa madrugada\b/, /\bmadrugada\b/],
  random: [
    /\boi\b/, /\bola\b/, /\bol[aã]\b/, /\bhello\b/, /\bhey\b/,
    /\be\s*a[ií]\b/, /\bsalve\b/, /\btudo bem\b/, /\bcomo vai\b/,
    /\bajuda\b/, /\bhelp\b/, /\bqual a boa\b/,
  ],
};

const replies = {
  morning: [
    "☀️ Bom dia, {name}! Que seu dia seja leve e produtivo.",
    "🌼 Bom dia, {name}! Bora fazer algo bacana hoje?",
    "☕ Bom dia! Café servido, {name}. Energia lá em cima!",
    "📈 Bom dia, {name}! Qual sua meta de hoje?",
  ],
  afternoon: [
    "🌤️ Boa tarde, {name}! Como está sendo o dia por aí?",
    "🍪 Boa tarde! Pausa com café e seguimos, {name}.",
    "💬 Boa tarde, {name}! Se precisar, tô por aqui.",
    "🎵 Boa tarde! Que trilha sonora acompanha você hoje, {name}?",
  ],
  night: [
    "🌙 Boa noite, {name}! Descanse bem e se cuide.",
    "✨ Boa noite! Que as horas sejam tranquilas, {name}.",
    "😴 Boa noite, {name}! Amanhã tem mais papos e café.",
    "🧣 Boa noite! Um bom descanso faz milagres, {name}.",
  ],
  madrugada: [
    "🌌 Boa madrugada, {name}! Lembre de descansar quando puder.",
    "🕯️ Madrugada calma… cuida de você, {name}!",
    "😌 Boa madrugada, {name}! Se precisar, estou por aqui.",
    "🛌 Madrugada é pra recarregar, {name}. Se cuida!",
  ],
  random: [
    "☕ Opa, {name}! Chegou bem. Em que posso ajudar hoje?",
    "👋 E aí, {name}! Bora trocar uma ideia?",
    "🔎 {name}, se tiver dúvida, manda o contexto que eu te ajudo.",
    "💡 {name}, traz uma curiosidade do dia!",
    "🎯 {name}, qual objetivo você quer alcançar agora?",
    "🎵 {name}, indica uma música que combine com o momento!",
    "📚 {name}, uma dica de livro/podcast pro café?",
    "📸 {name}, manda uma foto do seu setup com café ☕",
    "🤝 {name}, elogia alguém do servidor hoje!",
    "🧠 {name}, café coado ou espresso?",
    "🗣️ Fala comigo, {name}! O que tá acontecendo por aí?",
    "🚀 {name}, pequena vitória recente? Conta pra gente!",
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function handleKeywordResponder(message: Message) {
  try {
    if (message.author.bot) return;

    const botId = message.client.user?.id;
    if (!botId) return;

    // Se mencionou o bot, deixa o outro handler cuidar
    if (message.mentions.users.has(botId)) return;

    const now = Date.now();
    const last = userCooldown.get(message.author.id) ?? 0;
    if (now - last < COOLDOWN_MS) return;

    const content = normalize(message.content);

    let category: keyof typeof replies | null = null;
    if (patterns.morning.some((r) => r.test(content))) category = "morning";
    else if (patterns.afternoon.some((r) => r.test(content))) category = "afternoon";
    else if (patterns.night.some((r) => r.test(content))) category = "night";
    else if (patterns.madrugada.some((r) => r.test(content))) category = "madrugada";
    else if (patterns.random.some((r) => r.test(content))) category = "random";

    if (!category) return;

    userCooldown.set(message.author.id, now);
    const reply = formatReply(message, pick(replies[category]));
    await message.reply({ content: reply });
  } catch (_) {
    // silencioso
  }
}