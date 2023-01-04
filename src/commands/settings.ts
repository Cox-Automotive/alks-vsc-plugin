import * as vscode from "vscode";
import { getAccounts } from "../alks";
import { Cache } from "../cache";
import { Settings } from "../settings";

/**
 * Settings command for various extension settings.
 */
export const openSettings = async () => {
  let choice = await vscode.window.showQuickPick(["Sync Accounts", "Logout"]);

  if (choice?.includes("Sync")) {
    const accounts = await getAccounts();
    Cache.instance.setCacheItem("accounts", accounts);
    console.log(Cache.instance.getCacheItem("accounts"));
    vscode.window.showInformationMessage("Accounts refreshed.");
  } else if (choice === "Logout") {
    console.log("Deleting auth token");
    Settings.instance.deleteRefreshToken();
    vscode.window.showInformationMessage("Logged out.");
  } else {
    console.log("Invalid settings selection");
  }
};
