import {
  Client,
  GatewayIntentBits,
  ActivityType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { config } from "./config";
import { commands } from "./commands";
import { deployCommands } from "./commands/deploy-commands";
import { handleGuildMemberAdd, handleMention, startScheduledMessages, handleKeywordResponder } from "./events";
import { Logger } from "./utils/logger";
import { EmbedUtils } from "./utils/embeds";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", async () => {
  Logger.startup();

  // Atualiza presença com informações dinâmicas
  const refreshPresence = () => {
    const guildCount = client.guilds.cache.size;
    const userCount = client.users.cache.size;

    client.user?.setPresence({
      status: "online",
      activities: [
        {
          name: `☕ Center Café • ${guildCount} servidores • ${userCount} usuários • /welcome-preview`,
          type: ActivityType.Playing,
        },
      ],
    });
  };
  refreshPresence();

  const channelId: string = "1424920316039139438";
  const channel = await client.channels.fetch(channelId);

  const shouldSendStartup =
    process.env.NODE_ENV === "production" ||
    config.SEND_STARTUP_EMBED === "true";
  if (
    channel &&
    channel.isTextBased() &&
    "send" in channel &&
    shouldSendStartup
  ) {
    const startupEmbed = EmbedUtils.createStartupEmbed();
    // Botões interativos (se aplicável)
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      // new ButtonBuilder()
      //   .setLabel("➕ Adicionar Bot")
      //   .setStyle(ButtonStyle.Link)
      //   .setURL(config.BOT_INVITE_URL ?? `https://discord.com/api/oauth2/authorize?client_id=${config.DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`),
      new ButtonBuilder()
        .setLabel("📣 Servidor de Suporte")
        .setStyle(ButtonStyle.Link)
        .setURL(config.SUPPORT_SERVER_URL ?? "https://discord.com")
    );

    await channel.send({ embeds: [startupEmbed], components: [row] });
    Logger.success("Embed de inicialização enviado com sucesso!");
  } else if (channel && channel.isTextBased() && "send" in channel) {
    Logger.info(
      "Startup embed suprimido (dev/watch). Use SEND_STARTUP_EMBED=true para forçar."
    );
  }

  // Implantar/atualizar comandos em todos os servidores ao iniciar
  try {
    for (const guild of client.guilds.cache.values()) {
      await deployCommands({ guildId: guild.id });
      Logger.success(
        `Comandos implantados/atualizados em: ${guild.name} (${guild.id})`
      );
    }
  } catch (error) {
    Logger.error(`Falha ao implantar comandos no startup: ${error}`);
  }

  Logger.info(`Conectado como ${client.user?.tag}`);
  Logger.info(`Servindo ${client.guilds.cache.size} servidor(es)`);
  Logger.info(`Monitorando ${client.users.cache.size} usuário(s)`);

  // Atualiza presença periodicamente
  setInterval(refreshPresence, 5 * 60 * 1000);

  // Inicia o scheduler de mensagens automáticas
  startScheduledMessages(client);
});

client.on("guildCreate", async (guild) => {
  Logger.info(`Adicionado ao servidor: ${guild.name} (${guild.id})`);
  await deployCommands({ guildId: guild.id });
  Logger.success("Comandos implantados no novo servidor!");
  // Atualiza presença ao entrar em um novo servidor
  const guildCount = client.guilds.cache.size;
  const userCount = client.users.cache.size;
  client.user?.setPresence({
    status: "online",
    activities: [
      {
        name: `☕ Center Café • ${guildCount} servidores • ${userCount} usuários • /welcome-preview`,
        type: ActivityType.Playing,
      },
    ],
  });
});

client.on("guildDelete", async () => {
  // Atualiza presença ao sair de um servidor
  const guildCount = client.guilds.cache.size;
  const userCount = client.users.cache.size;
  client.user?.setPresence({
    status: "online",
    activities: [
      {
        name: `☕ Center Café • ${guildCount} servidores • ${userCount} usuários • /welcome-preview`,
        type: ActivityType.Playing,
      },
    ],
  });
});

client.on("guildMemberAdd", handleGuildMemberAdd);
client.on("messageCreate", handleMention);
client.on("messageCreate", handleKeywordResponder);

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) {
    return;
  }

  const { commandName } = interaction;
  Logger.info(`Comando executado: ${commandName} por ${interaction.user.tag}`);

  if (commands[commandName as keyof typeof commands]) {
    try {
      await commands[commandName as keyof typeof commands].execute(interaction);
    } catch (error) {
      Logger.error(`Erro ao executar comando ${commandName}: ${error}`);
    }
  }
});

client.login(config.DISCORD_TOKEN);
