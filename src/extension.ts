// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { commands, ExtensionContext, window } from "vscode";
import { Game } from "./lib/main";
import * as sidebar from "./lib/sidebar";
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
  const game = new Game(context);
  const sidebarIns = new sidebar.EntryList();
  window.registerTreeDataProvider("gems_rpg_game_otp", sidebarIns);
  commands.registerCommand("gems_rpg_game_otp.openChild", (args) => {
    if (!args) return;
    game.treeViewClick(args);
  });
}

// this method is called when your extension is deactivated
export function deactivate() {}
