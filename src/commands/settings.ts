import * as vscode from "vscode";
import { getAccounts } from "../alks";
import { Cache } from "../cache";
import { Settings } from "../settings";

export const openSettings = async () => {
  let choice = await vscode.window.showQuickPick(["Sync Accounts", "Logout"]);

  if (choice?.includes("Sync")) {
    const accounts = await getAccounts();
    Cache.instance.setCacheItem("accounts", accounts);
    console.log(Cache.instance.getCacheItem("accounts"));
  } else if (choice === "Logout") {
    console.log("Deleting auth token");
    Settings.instance.deleteRefreshToken();
  } else {
    console.log("Invalid settings selection");
  }
};
