import * as vscode from "vscode";
import { Cache } from "./cache";
import { newConsole } from "./commands/newConsole";
import { newSession } from "./commands/newSession";
import { openSettings } from "./commands/settings";
import { Settings } from "./settings";

export async function activate(context: vscode.ExtensionContext) {
  console.log("[[ ALKS VSC PLUGIN ACTIVATED ]]\n");
  Settings.init(context);
  Cache.init(context);

  context.subscriptions.push(
    vscode.commands.registerCommand("alks-vsc.newSession", newSession)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("alks-vsc.newConsole", newConsole)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("alks-vsc.openSettings", openSettings)
  );
}

export function deactivate() {}
