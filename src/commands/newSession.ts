import * as ALKS from "alks.js";
import * as vscode from "vscode";
import { getAccountAndRole, getALKSClient } from "../alks";
import { Settings } from "../settings";

export const newSession = async () => {
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
