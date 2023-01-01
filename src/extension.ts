import * as ALKS from "alks.js";
import * as vscode from "vscode";
import { generateConsoleUrl } from "./alks-console";
import { getSettings } from "./settings";

const getAccountRole = async (): Promise<[string, string]> => {
  const settings = getSettings();
  let acct = await vscode.window.showQuickPick(settings.accounts);
  const role = acct?.match(/(?<=\/).+?(?=\s)/g)?.[0];
  acct = acct?.split("/")[0];

  if (!acct || !role) {
    throw Error(
      'Invalid account selected. Account should be in format "#####/role - name"'
    );
  }

  return [acct, role];
};

const getALKSClient = async (): Promise<ALKS.Alks> => {
  let client: ALKS.Alks;
  let accessToken: ALKS.AccessToken;
  const settings = getSettings();

  try {
    client = ALKS.create({ baseUrl: settings.server } as ALKS.AlksProps);
    console.log("Exchanging refresh token for access token.");
    accessToken = await client.getAccessToken({
      refreshToken: settings.token,
    });
    console.log(`Got access token!`);
  } catch (e: any) {
    console.error(
      `Error exchanging refresh token for access token: "${e?.message}"`
    );
    throw new Error("Unable to authenticate token.");
  }

  try {
    console.log(`Creating ALKS client with access token auth.`);
    client = ALKS.create({
      baseUrl: settings.server,
      accessToken: accessToken.accessToken,
    });
  } catch (e: any) {
    console.error(`Error instantiating client: ${e?.message}`);
    throw new Error("Unable to connect to ALKS server.");
  }

  return client;
};

const newSession = async () => {
  let client: ALKS.Alks;
  let keys: any;

  try {
    client = await getALKSClient();
  } catch (e: any) {
    vscode.window.showErrorMessage(e?.message);
    return;
  }

  const [account, role] = await getAccountRole();

  try {
    console.log(
      `Requesting STS credentials for "${account}" with role "${role}.`
    );
    keys = await client.getIAMKeys({
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
};

const newConsole = async () => {
  const settings = getSettings();
  let client: ALKS.Alks;
  let keys: any;

  try {
    client = await getALKSClient();
  } catch (e: any) {
    vscode.window.showErrorMessage(e?.message);
    return;
  }

  const [account, role] = await getAccountRole();

  try {
    console.log(
      `Requesting STS credentials for "${account}" with role "${role}.`
    );

    keys = await client.getIAMKeys({
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

export function activate(context: vscode.ExtensionContext) {
  console.log("[[ ALKS VSC PLUGIN ACTIVATED ]]\n");

  const settings = getSettings();

  if (!settings.server) {
    return vscode.window.showErrorMessage(
      "Please setup alks.server in settings."
    );
  } else if (!settings.token) {
    return vscode.window.showErrorMessage(
      "Please setup alks.token in settings."
    );
  } else if (
    !settings.accounts ||
    !Array.isArray(settings.accounts) ||
    !settings.accounts.length
  ) {
    return vscode.window.showErrorMessage(
      "Please setup alks.accounts in settings."
    );
  }

  context.subscriptions.push(
    vscode.commands.registerCommand("alks-vsc.newSession", newSession)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("alks-vsc.newConsole", newConsole)
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
