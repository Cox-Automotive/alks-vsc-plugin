import * as ALKS from "alks.js";
import * as vscode from "vscode";
import { getAccountAndRole, getALKSClient } from "../alks";
import { generateConsoleUrl } from "../alks-console";
import { Settings } from "../settings";
console.log("<new console>");

export const newConsole = async () => {
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
