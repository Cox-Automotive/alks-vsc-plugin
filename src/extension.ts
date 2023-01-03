import * as ALKS from "alks.js";
import * as vscode from "vscode";
import { getAccountAndRole, getALKSClient } from "./alks";
import { generateConsoleUrl } from "./alks-console";
import { AuthSettings } from "./settings";

const newSession = async () => {
  console.log("<new session>");
  try {
    AuthSettings.instance.validate();
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
      AuthSettings.instance.getAccounts()!
    );
    [account, role] = await getAccountAndRole(rawAccount);
  } catch (e: any) {
    return vscode.window.showErrorMessage(e?.message);
  }

  try {
    console.log(
      `Requesting STS credentials for "${account}" with role "${role}.`
    );
    keys = await client.getIAMKeys({
      // FIXME: iam
      account,
      role,
      sessionTime: 1,
    });

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
  await AuthSettings.instance.deleteRefreshToken();
};

const openConsole = async () => {
  console.log("<open console>");
  try {
    AuthSettings.instance.validate();
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
      AuthSettings.instance.getAccounts()!
    );
    [account, role] = await getAccountAndRole(rawAccount);
  } catch (e: any) {
    return vscode.window.showErrorMessage(e?.message);
  }

  try {
    console.log(
      `Requesting STS credentials for "${account}" with role "${role}.`
    );

    keys = await client.getIAMKeys({
      // FIXME: iam
      account,
      role,
      sessionTime: 1,
    });

    console.log("Received STS credentials.");
  } catch (e: any) {
    console.error(`Error getting keys: "${e?.message}"`);
    vscode.window.showErrorMessage("Unable to create session!");
    return;
  }

  try {
    const url: string = await generateConsoleUrl(keys);
    console.log(`Got GUI URL `); //: ${url}`);

    vscode.env.openExternal(vscode.Uri.parse(url));
  } catch (e: any) {
    console.error(`Error getting keys: "${e?.message}"`);
    vscode.window.showErrorMessage("Unable to create session!");
    return;
  }
};

export async function activate(context: vscode.ExtensionContext) {
  console.log("[[ ALKS VSC PLUGIN ACTIVATED ]]\n");
  AuthSettings.init(context);

  context.subscriptions.push(
    vscode.commands.registerCommand("alks-vsc.newSession", newSession)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("alks-vsc.newConsole", openConsole)
  );
}

export function deactivate() {}
