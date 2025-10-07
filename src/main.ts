import { Client, GatewayIntentBits } from "discord.js";
import { config } from "./config";
import { commands } from "./commands";
import { deployCommands } from "./commands/deploy-commands";
import { handleGuildMemberAdd } from "./events";
import { Logger } from "./utils/logger";
import { EmbedUtils } from "./utils/embeds";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers
  ],
});

client.once("ready", async () => {
  Logger.startup();
  
  const channelId: string = "1424920316039139438";
  const channel = await client.channels.fetch(channelId);
  
  if (channel && channel.isTextBased() && "send" in channel) {
    const startupEmbed = EmbedUtils.createStartupEmbed();
    await channel.send({ embeds: [startupEmbed] });
    Logger.success("Embed de inicialização enviado com sucesso!");
  }
  
  Logger.info(`Conectado como ${client.user?.tag}`);
  Logger.info(`Servindo ${client.guilds.cache.size} servidor(es)`);
  Logger.info(`Monitorando ${client.users.cache.size} usuário(s)`);
});

client.on("guildCreate", async (guild) => {
  Logger.info(`Adicionado ao servidor: ${guild.name} (${guild.id})`);
  await deployCommands({ guildId: guild.id });
  Logger.success("Comandos implantados no novo servidor!");
});

client.on("guildMemberAdd", handleGuildMemberAdd);

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
