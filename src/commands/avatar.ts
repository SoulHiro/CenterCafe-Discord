import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("avatar")
  .setDescription("Exibe o avatar de um usuário")
  .addUserOption(option =>
    option
      .setName("usuario")
      .setDescription("Usuário para exibir o avatar (deixe vazio para seu próprio avatar)")
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const targetUser = interaction.options.getUser("usuario") || interaction.user;
    
    // Obter avatar em alta qualidade
    const avatarUrl = targetUser.displayAvatarURL({ 
      size: 2048, 
      extension: "png" 
    });
    
    const embed = new EmbedBuilder()
      .setTitle(`Avatar de ${targetUser.displayName}`)
      .setDescription(`**Tag:** ${targetUser.tag}\n**ID:** ${targetUser.id}`)
      .setImage(avatarUrl)
      .setColor(0x8B4513) // Cor marrom café
      .setFooter({ 
        text: `Solicitado por ${interaction.user.displayName}`, 
        iconURL: interaction.user.displayAvatarURL() 
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Erro no comando avatar:", error);
    await interaction.reply({
      content: "❌ Ocorreu um erro ao exibir o avatar.",
      ephemeral: true
    });
  }
}