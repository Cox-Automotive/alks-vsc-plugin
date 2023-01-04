import * as vscode from "vscode";
import { getAccounts } from "./alks";
import { Cache } from "./cache";
import { newConsole } from "./commands/newConsole";
import { newSession } from "./commands/newSession";
import { openSettings } from "./commands/settings";
import { Settings } from "./settings";

export async function activate(context: vscode.ExtensionContext) {
  console.log("[[ ALKS VSC PLUGIN ACTIVATED ]]\n");
  Settings.init(context);
  const cache = Cache.init(context);

  // cache the accounts on first run
  if (!cache.getCacheItem("accounts")) {
    try {
      const accounts = await getAccounts();
      cache.setCacheItem("accounts", accounts);
      console.log("cached aws accounts");
    } catch (e: any) {
      // silently swallow, user may have not setup token yet
    }
  }

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
