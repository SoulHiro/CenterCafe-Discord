import { Client, TextChannel } from "discord.js";
import { config } from "../config";
import { goodMorningMessages } from "./messages/good-morning";
import { goodEveningMessages } from "./messages/good-evening";
import { goodNightMessages } from "./messages/good-night";
import { nightRandomMessages } from "./messages/night-random";
import { dayRandomMessages } from "./messages/day-random";
import { midnightMessages } from "./messages/midnight";

let schedulerStarted = false;
const activeTimeouts: NodeJS.Timeout[] = [];

const BROADCAST_CHANNEL_ID =
  config.BROADCAST_CHANNEL_ID ?? "1404485327242133625";

// Fuso horário UTC-3 (São Paulo)
const SAO_PAULO_OFFSET = -3;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function sendToBroadcast(client: Client, content: string) {
  try {
    const channel = await client.channels.fetch(BROADCAST_CHANNEL_ID);
    if (channel && channel.isTextBased() && "send" in channel) {
      await (channel as TextChannel).send({ content });
    }
  } catch (_) {
    // Se o canal não existir ou não puder enviar, silencia para evitar ruído
  }
}

// Função para obter data/hora atual no fuso UTC-3 (São Paulo)
function getSaoPauloTime(): Date {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (SAO_PAULO_OFFSET * 3600000));
}

// Função para calcular milissegundos até próximo horário específico em UTC-3
function msUntilNextSaoPaulo(hour: number, minute: number = 0): number {
  const now = getSaoPauloTime();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  
  return target.getTime() - now.getTime();
}

// Função para verificar se estamos dentro de um intervalo de horário em UTC-3
function isWithinSaoPauloHours(startHour: number, endHour: number): boolean {
  const now = getSaoPauloTime();
  const currentHour = now.getHours();
  
  if (startHour <= endHour) {
    return currentHour >= startHour && currentHour < endHour;
  } else {
    // Intervalo que cruza meia-noite (ex: 22h às 6h)
    return currentHour >= startHour || currentHour < endHour;
  }
}

export function startScheduledMessages(client: Client) {
  if (schedulerStarted) return;
  schedulerStarted = true;

  // Limpar timeouts anteriores se existirem
  activeTimeouts.forEach(timeout => clearTimeout(timeout));
  activeTimeouts.length = 0;

  // 1. Mensagem de bom dia às 8h exatas (UTC-3)
  const morningDelay = msUntilNextSaoPaulo(8, 0);
  const morningTimeout = setTimeout(async () => {
    await sendToBroadcast(client, pick(goodMorningMessages));
    // Reagendar para o próximo dia
    const dailyMorningInterval = setInterval(async () => {
      await sendToBroadcast(client, pick(goodMorningMessages));
    }, 24 * 60 * 60 * 1000);
    activeTimeouts.push(dailyMorningInterval as any);
  }, morningDelay);
  activeTimeouts.push(morningTimeout);

  // 2. Mensagem de boa noite (chegada) às 18h exatas (UTC-3)
  const eveningDelay = msUntilNextSaoPaulo(18, 0);
  const eveningTimeout = setTimeout(async () => {
    await sendToBroadcast(client, pick(goodEveningMessages));
    // Reagendar para o próximo dia
    const dailyEveningInterval = setInterval(async () => {
      await sendToBroadcast(client, pick(goodEveningMessages));
    }, 24 * 60 * 60 * 1000);
    activeTimeouts.push(dailyEveningInterval as any);
  }, eveningDelay);
  activeTimeouts.push(eveningTimeout);

  // 3. Mensagem de boa noite (despedida) às 24h/00h exatas (UTC-3)
  const midnightDelay = msUntilNextSaoPaulo(0, 0);
  const midnightTimeout = setTimeout(async () => {
    await sendToBroadcast(client, pick(goodNightMessages));
    // Reagendar para o próximo dia
    const dailyMidnightInterval = setInterval(async () => {
      await sendToBroadcast(client, pick(goodNightMessages));
    }, 24 * 60 * 60 * 1000);
    activeTimeouts.push(dailyMidnightInterval as any);
  }, midnightDelay);
  activeTimeouts.push(midnightTimeout);

  // 4. Agendar mensagens aleatórias entre 10h-17h
  scheduleRandomDayMessages(client);

  // 5. Agendar mensagens de madrugada entre 01h-05h
  scheduleNightMessages(client);
}

// Função para agendar mensagens aleatórias durante o dia (10h-17h UTC-3)
function scheduleRandomDayMessages(client: Client) {
  const scheduleForToday = () => {
    const now = getSaoPauloTime();
    const startHour = 10;
    const endHour = 17;
    
    // Se já passou das 17h, agenda para amanhã
    if (now.getHours() >= endHour) {
      const tomorrowStart = msUntilNextSaoPaulo(startHour, 0);
      const tomorrowTimeout = setTimeout(() => {
        scheduleForToday();
      }, tomorrowStart);
      activeTimeouts.push(tomorrowTimeout);
      return;
    }

    // Calcular janela de tempo disponível
    const windowStart = now.getHours() < startHour ? 
      new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, 0, 0) : 
      now;
    
    const windowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHour, 0, 0);
    
    // Gerar 2-3 horários aleatórios com intervalo mínimo de 2 horas
    const minInterval = 2 * 60 * 60 * 1000; // 2 horas em ms
    const availableTime = windowEnd.getTime() - windowStart.getTime();
    
    if (availableTime > 0) {
      const numMessages = Math.min(3, Math.floor(availableTime / minInterval) + 1);
      
      for (let i = 0; i < numMessages; i++) {
        const minTime = windowStart.getTime() + (i * minInterval);
        const maxTime = Math.min(windowEnd.getTime(), minTime + minInterval);
        
        if (minTime < maxTime) {
          const randomTime = minTime + Math.random() * (maxTime - minTime);
          const delay = randomTime - now.getTime();
          
          if (delay > 0) {
            const randomTimeout = setTimeout(async () => {
              await sendToBroadcast(client, pick(dayRandomMessages));
            }, delay);
            activeTimeouts.push(randomTimeout);
          }
        }
      }
    }

    // Agendar para o próximo dia
    const nextDayDelay = msUntilNextSaoPaulo(startHour, 0);
    const nextDayTimeout = setTimeout(() => {
      scheduleForToday();
    }, nextDayDelay);
    activeTimeouts.push(nextDayTimeout);
  };

  scheduleForToday();
}

// Função para agendar mensagens de madrugada (01h-05h UTC-3)
function scheduleNightMessages(client: Client) {
  const scheduleForTonight = () => {
    const now = getSaoPauloTime();
    const startHour = 1;
    const endHour = 5;
    
    // Verificar se estamos no período noturno
    const isNightTime = now.getHours() >= startHour && now.getHours() < endHour;
    
    if (!isNightTime && now.getHours() >= endHour) {
      // Se já passou das 5h, agenda para a próxima madrugada (1h de amanhã)
      const nextNightDelay = msUntilNextSaoPaulo(startHour, 0);
      const nextNightTimeout = setTimeout(() => {
        scheduleForTonight();
      }, nextNightDelay);
      activeTimeouts.push(nextNightTimeout);
      return;
    }

    // Calcular janela de tempo disponível
    let windowStart: Date;
    let windowEnd: Date;
    
    if (isNightTime) {
      // Estamos na madrugada atual
      windowStart = now;
      windowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHour, 0, 0);
    } else {
      // Agendar para a próxima madrugada
      const nextDay = new Date(now);
      nextDay.setDate(nextDay.getDate() + 1);
      windowStart = new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), startHour, 0, 0);
      windowEnd = new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), endHour, 0, 0);
    }
    
    // Gerar 1-2 mensagens aleatórias na madrugada
    const availableTime = windowEnd.getTime() - windowStart.getTime();
    
    if (availableTime > 0) {
      const numMessages = Math.random() > 0.5 ? 2 : 1;
      const minInterval = 90 * 60 * 1000; // 1.5 horas em ms
      
      for (let i = 0; i < numMessages; i++) {
        const minTime = windowStart.getTime() + (i * minInterval);
        const maxTime = Math.min(windowEnd.getTime(), minTime + minInterval);
        
        if (minTime < maxTime) {
          const randomTime = minTime + Math.random() * (maxTime - minTime);
          const delay = randomTime - now.getTime();
          
          if (delay > 0) {
            const nightTimeout = setTimeout(async () => {
              await sendToBroadcast(client, pick(nightRandomMessages));
            }, delay);
            activeTimeouts.push(nightTimeout);
          }
        }
      }
    }

    // Agendar para a próxima madrugada
    const nextNightDelay = msUntilNextSaoPaulo(startHour, 0);
    const nextNightTimeout = setTimeout(() => {
      scheduleForTonight();
    }, nextNightDelay);
    activeTimeouts.push(nextNightTimeout);
  };

  scheduleForTonight();
}
