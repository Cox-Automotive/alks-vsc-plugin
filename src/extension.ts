import * as ALKS from "alks.js";
import * as vscode from "vscode";
import { getAccountAndRole, getAccounts, getALKSClient } from "./alks";
import { generateConsoleUrl } from "./alks-console";
import { Cache } from "./cache";
import { Settings } from "./settings";

const newSession = async () => {
  console.log("<new session>");
  try {
    Settings.instance.validate();
  } catch (e: any) {
    return vscode.window.showErrorMessage(e?.message);
  }

  let client: ALKS.Alks;
  let keys: any;

  try {
    client = await getALKSClient();
  } catch (e: any) {
    vscode.window.showErrorMessage(e?.message);
    return;
  }

  let account: string;
  let role: string;

  try {
    let rawAccount = await vscode.window.showQuickPick(
      Settings.instance.getAccounts()!
    );
    [account, role] = await getAccountAndRole(rawAccount);
  } catch (e: any) {
    return vscode.window.showErrorMessage(e?.message);
  }

  try {
    const opts = { account, role, sessionTime: 1 };
    if (role.toLowerCase().includes("iam")) {
      console.log(`Requesting IAM creds for "${account}" role "${role}"`);
      keys = await client.getIAMKeys(opts);
    } else {
      console.log(`Requesting creds for "${account}" role "${role}"`);
      keys = await client.getKeys(opts);
    }
    console.log("Received STS credentials.");
  } catch (e: any) {
    console.error(`Error getting keys: "${e?.message}"`);
    vscode.window.showErrorMessage("Unable to create session!");
    return;
  }

  const exporty = `export AWS_ACCESS_KEY_ID=${keys.accessKey} && export AWS_SECRET_ACCESS_KEY=${keys.secretKey} && export AWS_SESSION_TOKEN=${keys.sessionToken}`;
  vscode.env.clipboard.writeText(exporty);
  vscode.window.showInformationMessage(
    "AWS terminal credentials are now on your clipboard."
  );
  await Settings.instance.deleteRefreshToken();
};

const openConsole = async () => {
  console.log("<open console>");
  try {
    Settings.instance.validate();
  } catch (e: any) {
    return vscode.window.showErrorMessage(e?.message);
  }

  let client: ALKS.Alks;
  let keys: any;

  try {
    client = await getALKSClient();
  } catch (e: any) {
    vscode.window.showErrorMessage(e?.message);
    return;
  }

  let account: string;
  let role: string;

  try {
    let rawAccount = await vscode.window.showQuickPick(
      Settings.instance.getAccounts()!
    );
    [account, role] = await getAccountAndRole(rawAccount);
  } catch (e: any) {
    return vscode.window.showErrorMessage(e?.message);
  }

  try {
    const opts = { account, role, sessionTime: 1 };
    if (role.toLowerCase().includes("iam")) {
      console.log(`Requesting IAM creds for "${account}" role "${role}"`);
      keys = await client.getIAMKeys(opts);
    } else {
      console.log(`Requesting creds for "${account}" role "${role}"`);
      keys = await client.getKeys(opts);
    }

    console.log("Received STS credentials.");
  } catch (e: any) {
    console.error(`Error getting keys: "${e?.message}"`);
    vscode.window.showErrorMessage("Unable to create session!");
    return;
  }

  try {
    const url: string = await generateConsoleUrl(keys);

    vscode.env.openExternal(vscode.Uri.parse(url));
  } catch (e: any) {
    console.error(`Error getting keys: "${e?.message}"`);
    vscode.window.showErrorMessage("Unable to create session!");
    return;
  }
};

const openSettings = async () => {
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

export async function activate(context: vscode.ExtensionContext) {
  console.log("[[ ALKS VSC PLUGIN ACTIVATED ]]\n");
  Settings.init(context);
  const cache = Cache.init(context);

  // cache the accounts on first run
  if (!cache.getCacheItem("accounts")) {
    const accounts = await getAccounts();
    cache.setCacheItem("accounts", accounts);
    console.log("cached aws accounts");
  }

  context.subscriptions.push(
    vscode.commands.registerCommand("alks-vsc.newSession", newSession)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("alks-vsc.newConsole", openConsole)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("alks-vsc.openSettings", openSettings)
  );
}

export function deactivate() {}
