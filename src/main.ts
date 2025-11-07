import {
  Client,
  GatewayIntentBits,
  ActivityType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { config } from "./config";
import { commands } from "./commands";
import { deployCommands } from "./commands/deploy-commands";
import { handleGuildMemberAdd } from "./events";
import { handleTicTacToeButton } from "./commands/tic-tac-toe";
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

  const channelId: string = "1252789815192191036";
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
    const startupEmbed = EmbedUtils.createStartupEmbed(client);
    // Botões interativos (se aplicável)
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      // new ButtonBuilder()
      //   .setLabel("➕ Adicionar Bot")
      //   .setStyle(ButtonStyle.Link)
      //   .setURL(config.BOT_INVITE_URL ?? `https://discord.com/api/oauth2/authorize?client_id=${config.DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`),
      new ButtonBuilder()
        .setLabel("📣 Servidor de Suporte")
        .setStyle(ButtonStyle.Link)
        .setURL(config.SUPPORT_SERVER_URL ?? "https://discord.com"),
      new ButtonBuilder()
        .setLabel("🎮 Comandos Disponíveis")
        .setStyle(ButtonStyle.Secondary)
        .setCustomId("show_commands")
        .setEmoji("📋"),
      new ButtonBuilder()
        .setLabel("🛡️ Sistema Anti-Raid")
        .setStyle(ButtonStyle.Secondary)
        .setCustomId("antiraid_info")
        .setEmoji("🔒")
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

client.on("interactionCreate", async (interaction) => {
  // Manipular botões do jogo da velha
  if (interaction.isButton() && interaction.customId.startsWith("ttt_")) {
    await handleTicTacToeButton(interaction);
    return;
  }

  // Manipular botões da mensagem de inicialização
  if (interaction.isButton()) {
    if (interaction.customId === "show_commands") {
      const commandsEmbed = new EmbedBuilder()
        .setTitle("📋 Lista Completa de Comandos")
        .setDescription(
          "Aqui estão todos os comandos disponíveis no Center Café Bot:"
        )
        .setColor(0x8b4513)
        .addFields(
          {
            name: "🎮 Entretenimento",
            value:
              "`/jogo-da-velha` - Inicie uma partida de jogo da velha\n`/ping` - Verifique a latência do bot",
            inline: false,
          },
          {
            name: "👤 Informações de Usuários",
            value:
              "`/avatar [usuário]` - Visualize o avatar de um usuário\n`/userinfo [usuário]` - Informações detalhadas do usuário",
            inline: false,
          },
          {
            name: "🏠 Informações do Servidor",
            value: "`/serverinfo` - Estatísticas completas do servidor",
            inline: false,
          },
          {
            name: "🛡️ Moderação & Segurança",
            value:
              "`/antiraid` - Gerenciar sistema anti-raid\n`/clear [quantidade]` - Limpar mensagens (moderadores)",
            inline: false,
          },
          {
            name: "⚙️ Administração",
            value:
              "`/update-commands` - Atualizar comandos slash (admin)\n`/welcome-preview` - Visualizar mensagem de boas-vindas",
            inline: false,
          }
        )
        .setFooter({ text: "Use / para ver os comandos disponíveis no chat!" })
        .setTimestamp();

      await interaction.reply({ embeds: [commandsEmbed], ephemeral: true });
      return;
    }

    if (interaction.customId === "antiraid_info") {
      const antiraidEmbed = new EmbedBuilder()
        .setTitle("🛡️ Sistema Anti-Raid - Center Café")
        .setDescription(
          "Nosso sistema de proteção avançado mantém o servidor seguro contra ataques coordenados."
        )
        .setColor(0xff4444)
        .addFields(
          {
            name: "🚨 Detecção Automática",
            value:
              "• Monitora entradas rápidas de membros\n• Limite: 5 membros em 5 minutos\n• Ativação automática em caso de suspeita",
            inline: false,
          },
          {
            name: "🔒 Quarentena Inteligente",
            value:
              "• Isolamento automático de novos membros suspeitos\n• Remoção de permissões temporária\n• Liberação automática após 10 minutos",
            inline: false,
          },
          {
            name: "📊 Comandos de Gerenciamento",
            value:
              "`/antiraid status` - Ver estatísticas atuais\n`/antiraid liberar @usuário` - Remover da quarentena\n`/antiraid verificar @usuário` - Verificar status",
            inline: false,
          },
          {
            name: "📝 Logs Detalhados",
            value:
              "Todas as ações são registradas no canal de logs para auditoria completa.",
            inline: false,
          }
        )
        .setFooter({
          text: "Sistema desenvolvido para proteger nossa comunidade",
        })
        .setTimestamp();

      await interaction.reply({ embeds: [antiraidEmbed], ephemeral: true });
      return;
    }
  }

  if (!interaction.isCommand()) {
    return;
  }

  const { commandName } = interaction;
  Logger.info(`Comando executado: ${commandName} por ${interaction.user.tag}`);

  if (commands[commandName as keyof typeof commands]) {
    try {
      if (interaction.isChatInputCommand()) {
        await commands[commandName as keyof typeof commands].execute(
          interaction
        );
      }
    } catch (error) {
      Logger.error(`Erro ao executar comando ${commandName}: ${error}`);
    }
  }
});

client.login(config.DISCORD_TOKEN);
