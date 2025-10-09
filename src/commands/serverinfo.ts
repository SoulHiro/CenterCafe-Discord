import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ChannelType,
  GuildVerificationLevel,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("serverinfo")
  .setDescription("Exibe informações detalhadas do servidor");

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    if (!interaction.guild) {
      await interaction.reply({
        content: "❌ Este comando só pode ser usado em servidores.",
        ephemeral: true,
      });
      return;
    }

    const guild = interaction.guild;

    // Buscar informações do proprietário
    const owner = await guild.fetchOwner();

    // Contar membros online/offline
    const members = await guild.members.fetch();

    // Contar canais por tipo
    const channels = guild.channels.cache;
    const textChannels = channels.filter(
      (channel) => channel.type === ChannelType.GuildText
    ).size;
    const voiceChannels = channels.filter(
      (channel) => channel.type === ChannelType.GuildVoice
    ).size;

    // Mapear nível de verificação
    const verificationLevels = {
      [GuildVerificationLevel.None]: "Nenhuma",
      [GuildVerificationLevel.Low]: "Baixa",
      [GuildVerificationLevel.Medium]: "Média",
      [GuildVerificationLevel.High]: "Alta",
      [GuildVerificationLevel.VeryHigh]: "Muito Alta",
    };

    // Ícone do servidor (usar o fornecido ou padrão)
    const serverIconUrl =
      guild.iconURL({ size: 2048 }) ||
      "https://images-ext-1.discordapp.net/external/x-V_g20fpSzJxfdztJyzfljN2OGi0pqME8xl45tO45s/%3Fsize%3D2048/https/cdn.discordapp.com/icons/1061343817778860173/a_549b8887e5b1ebda81709b078807037b.gif";

    const embed = new EmbedBuilder()
      .setTitle(`📊 Informações do Servidor`)
      .setThumbnail(serverIconUrl)
      .setColor(0x8b4513) // Cor marrom café
      .addFields(
        {
          name: "🏷️ Nome do Servidor",
          value: guild.name,
          inline: false,
        },
        {
          name: "🆔 ID do Servidor",
          value: guild.id,
          inline: false,
        },
        {
          name: "👑 Proprietário",
          value: `${owner.user.displayName} (${owner.user.tag})`,
          inline: false,
        },
        {
          name: "📅 Data de Criação",
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
          inline: false,
        },
        {
          name: "📺 Canais",
          value: `**Total:** ${channels.size}`,
          inline: true,
        },
        {
          name: "👥 Membros",
          value: `**Total:** ${members.size}`,
          inline: true,
        },
        {
          name: "🎭 Cargos",
          value: guild.roles.cache.size.toString(),
          inline: true,
        },
        {
          name: "🔒 Nível de Verificação",
          value: verificationLevels[guild.verificationLevel] || "Desconhecido",
          inline: true,
        },
        {
          name: "🌍 Região",
          value: guild.preferredLocale || "Não especificada",
          inline: true,
        }
      )
      .setFooter({
        text: `Solicitado por ${interaction.user.displayName}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Erro no comando serverinfo:", error);
    await interaction.reply({
      content: "❌ Ocorreu um erro ao obter informações do servidor.",
      ephemeral: true,
    });
  }
}
