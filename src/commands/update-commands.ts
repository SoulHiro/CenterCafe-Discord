import { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits, REST, Routes } from 'discord.js';
import { EmbedUtils } from '../utils/embeds';
import { config } from '../config';
import * as ping from './ping';

export const data = new SlashCommandBuilder()
  .setName('update-commands')
  .setDescription('Atualiza todos os slash commands do bot')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: CommandInteraction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.guild) {
      const errorEmbed = EmbedUtils.createErrorEmbed('Este comando só pode ser usado em servidores!');
      await interaction.editReply({ embeds: [errorEmbed] });
      return;
    }

    // Definindo comandos localmente para evitar dependência circular
    const commands = {
      ping,
      "update-commands": { data }
    };

    const commandsData = Object.values(commands).map((command) => command.data);
    const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

    await rest.put(
      Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, interaction.guild.id),
      {
        body: commandsData,
      }
    );

    const successEmbed = EmbedUtils.createSuccessEmbed(
      '🔄 Comandos atualizados com sucesso!\n\nTodos os slash commands foram registrados e estão prontos para uso.'
    );

    await interaction.editReply({ embeds: [successEmbed] });
  } catch (error) {
    console.error('Erro ao atualizar comandos:', error);
    
    const errorEmbed = EmbedUtils.createErrorEmbed(
      'Ocorreu um erro ao atualizar os comandos. Verifique os logs do console.'
    );

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}