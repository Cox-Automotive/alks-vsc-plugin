import * as ALKS from "alks.js";
import * as vscode from "vscode";
import { getAccountAndRole, getALKSClient } from "../alks";
import { Settings } from "../settings";


const selectTerminal = async (): Promise<vscode.Terminal> => {
  interface TerminalQuickPickItem extends vscode.QuickPickItem {
    terminal: vscode.Terminal;
  }

  const terminals = <vscode.Terminal[]>(<any>vscode.window).terminals;

  const items: TerminalQuickPickItem[] = terminals.map((t) => {
    return {
      label: `name: ${t.name}`,
      terminal: t,
    };
  });

  let terminal = await vscode.window.showQuickPick(items).then((item) => {
    return item ? item.terminal : undefined;
  });

  if (!terminal) {
    terminal = await vscode.window.createTerminal(`ALKS Terminal`);
  }

  return terminal;
};

/**
 * Creates a new ALKS session for the specified account and copys the credentials to the
 */
export const newSession = async (): Promise<void> => {
  console.log("[newSession] <new session>");
  try {
    await Settings.instance.validate();
  } catch (e: any) {
    vscode.window.showErrorMessage(e?.message);
    return await newSession();
  }

  console.log("[newSession] fetching active terminal");
  const terminal = await selectTerminal();

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
    vscode.window.showErrorMessage(e?.message);
    return;
  }

  try {
    const opts = { account, role, sessionTime: 1 };
    if (role.toLowerCase().includes("iam")) {
      console.log(
        `[newSession] Requesting IAM creds for "${account}" role "${role}"`
      );
      keys = await client.getIAMKeys(opts);
    } else {
      console.log(
        `[newSession] Requesting creds for "${account}" role "${role}"`
      );
      keys = await client.getKeys(opts);
    }
    console.log("[newSession] Received STS credentials.");
  } catch (e: any) {
    console.error(`Error getting keys: "${e?.message}"`);
    vscode.window.showErrorMessage("Unable to create session!");
    return;
  }

  // @ts-ignore: 2339
  const shell = terminal.creationOptions.shellPath;
  let cmd = `export AWS_ACCESS_KEY_ID=${keys.accessKey} && export AWS_SECRET_ACCESS_KEY=${keys.secretKey} && export AWS_SESSION_TOKEN=${keys.sessionToken}`;

  // TODO: powershell
  // if (false) {
  //   cmd = `$env:AWS_ACCESS_KEY_ID, $env:AWS_SECRET_ACCESS_KEY, $env:AWS_SESSION_TOKEN = "${keys.accessKey}","${keys.secretKey}","${keys.sessionToken}"`;
  // }

  terminal.sendText(cmd);

  vscode.window.showInformationMessage(
    "Your AWS session has been configured in your terminal."
  );
};
