import * as ping from "./ping";
import * as updateCommands from "./update-commands";
import * as welcomePreview from "./welcome-preview";
import * as clear from "./clear";
import * as ticTacToe from "./tic-tac-toe";
import * as avatar from "./avatar";
import * as serverinfo from "./serverinfo";
import * as userinfo from "./userinfo";

export const commands = {
  ping,
  "update-commands": updateCommands,
  "welcome-preview": welcomePreview,
  clear,
  "jogo-da-velha": ticTacToe,
  avatar,
  serverinfo,
  userinfo,
};
