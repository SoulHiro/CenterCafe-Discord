import { REST, Routes } from "discord.js";
import { config } from "../config";
import * as ping from "./ping";
import * as updateCommands from "./update-commands";
import * as welcomePreview from "./welcome-preview";

// Definindo comandos diretamente aqui para evitar dependência circular
const commands = {
  ping,
  "update-commands": updateCommands,
  "welcome-preview": welcomePreview,
};

const commandsData = Object.values(commands).map((command) => command.data.toJSON());
const commandNames = commandsData.map((c) => c.name);

const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

type DeployCommandsProps = {
  guildId: string;
};

export async function deployCommands({ guildId }: DeployCommandsProps) {
  try {
    console.log("Started refreshing application (/) commands.");
    console.log("Registering commands:", commandNames);

    await rest.put(
      Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, guildId),
      {
        body: commandsData,
      }
    );

    console.log("Successfully reloaded application (/) commands.");
    console.log("Commands registered:", commandNames);
  } catch (error) {
    console.error(error);
  }
}
