import { Client, TextChannel } from "discord.js";
import { config } from "../config";
import { goodMorningMessages } from "./messages/good-morning";
import { goodEveningMessages } from "./messages/good-evening";
import { goodNightMessages } from "./messages/good-night";
import { nightRandomMessages } from "./messages/night-random";
import { dayRandomMessages } from "./messages/day-random";
import { midnightMessages } from "./messages/midnight";

let schedulerStarted = false;

const BROADCAST_CHANNEL_ID =
  config.BROADCAST_CHANNEL_ID ?? "1404485327242133625";

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

function msUntilNext(hour: number, minute: number): number {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - now.getTime();
}

export function startScheduledMessages(client: Client) {
  if (schedulerStarted) return;
  schedulerStarted = true;

  // Bom dia às 06:00
  const morningDelay = msUntilNext(6, 0);
  setTimeout(async () => {
    await sendToBroadcast(client, pick(goodMorningMessages));
    setInterval(() => {
      sendToBroadcast(client, pick(goodMorningMessages));
    }, 24 * 60 * 60 * 1000);
  }, morningDelay);

  // Boa noite de chegada às 18:00
  const goodEveningDelay = msUntilNext(18, 0);
  setTimeout(async () => {
    await sendToBroadcast(client, pick(goodEveningMessages));
    setInterval(() => {
      sendToBroadcast(client, pick(goodEveningMessages));
    }, 24 * 60 * 60 * 1000);
  }, goodEveningDelay);

  // Boa noite para dormir às 23:00
  const goodNightDelay = msUntilNext(23, 0);
  setTimeout(async () => {
    await sendToBroadcast(client, pick(goodNightMessages));
    setInterval(() => {
      sendToBroadcast(client, pick(goodNightMessages));
    }, 24 * 60 * 60 * 1000);
  }, goodNightDelay);

  // Meia-noite (00:00): enviar aviso e agendar mensagens do dia
  const midnightDelay = msUntilNext(0, 0);
  setTimeout(async () => {
    await sendToBroadcast(client, pick(midnightMessages));
    scheduleDayWindowMessages(client);
    setInterval(async () => {
      await sendToBroadcast(client, pick(midnightMessages));
      scheduleDayWindowMessages(client);
    }, 24 * 60 * 60 * 1000);
  }, midnightDelay);

  // Caso o bot inicie no meio do dia, agenda imediatamente o restante do dia
  scheduleDayWindowMessages(client);
}

// Controla agendamento por dia para não duplicar
let dayScheduleDate: string | null = null;

function scheduleDayWindowMessages(client: Client) {
  const now = new Date();
  const todayKey = now.toDateString();
  if (dayScheduleDate === todayKey) return;
  dayScheduleDate = todayKey;

  const start = new Date(now);
  start.setHours(8, 0, 0, 0); // janela começa às 08:00
  const end = new Date(now);
  end.setHours(17, 30, 0, 0); // janela termina às 17:30 (antes da boa noite de chegada)

  // Se já passou do fim da janela, não agenda nada para hoje
  if (now >= end) return;

  // Se ainda não chegou ao início da janela, usa 08:00 como início
  const windowStart = now < start ? start : now;

  const minIntervalMs = 5 * 60 * 60 * 1000; // 5 horas
  const canHaveTwo = end.getTime() - windowStart.getTime() >= minIntervalMs;

  // Escolhe até dois horários aleatórios respeitando o intervalo mínimo
  const timeouts: number[] = [];

  const randBetween = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  if (canHaveTwo) {
    // Primeiro horário entre windowStart e (end - 5h)
    const firstMin = windowStart.getTime();
    const firstMax = end.getTime() - minIntervalMs;
    const firstTs = randBetween(firstMin, Math.max(firstMin, firstMax));
    const secondMin = firstTs + minIntervalMs;
    if (secondMin <= end.getTime()) {
      const secondTs = randBetween(secondMin, end.getTime());
      timeouts.push(firstTs - now.getTime());
      timeouts.push(secondTs - now.getTime());
    } else {
      // Não há espaço para a segunda mensagem, agenda só uma
      timeouts.push(firstTs - now.getTime());
    }
  } else {
    // Apenas uma mensagem entre windowStart e end
    const oneTs = randBetween(windowStart.getTime(), end.getTime());
    timeouts.push(oneTs - now.getTime());
  }

  // Envia mensagens diurnas aleatórias nos horários definidos
  for (const delay of timeouts) {
    if (delay <= 0) continue; // segurança
    setTimeout(() => {
      sendToBroadcast(client, pick(dayRandomMessages));
    }, delay);
  }
}
