import * as ALKS from "alks.js";
import * as vscode from "vscode";
import { generateConsoleUrl } from "./alks-console";
import { AuthSettings } from "./settings";

const account = "625218762371";
const role = "IAMAdmin";

const getALKSClient = async (): Promise<ALKS.Alks> => {
  let client: ALKS.Alks;
  let accessToken: ALKS.AccessToken;

  try {
    client = ALKS.create({
      baseUrl: AuthSettings.instance.getServer(),
    } as ALKS.AlksProps);
    const refreshToken = await AuthSettings.instance.getRefreshToken();
    console.log(`Exchanging refresh token for access token: "${refreshToken}"`);
    accessToken = await client.getAccessToken({
      refreshToken,
    } as ALKS.GetAccessTokenProps);
    console.log(`Got access token!`);
  } catch (e: any) {
    console.error(
      `Error exchanging refresh token for access token: "${e?.message}". Purging existing refresh token.`
    );
    await AuthSettings.instance.deleteRefreshToken();

    throw new Error("Unable to authenticate token.");
  }
  AuthSettings.instance.deleteRefreshToken();

  try {
    console.log(`Creating ALKS client with access token auth.`);
    client = ALKS.create({
      baseUrl: AuthSettings.instance.getServer()!,
      accessToken: accessToken.accessToken,
    });
  } catch (e: any) {
    console.error(`Error instantiating client: ${e?.message}`);
    throw new Error("Unable to connect to ALKS server.");
  }

  return client;
};

const newSession = async () => {
  console.log("<new session>");
  if (!(await validateSettings())) {
    return;
  }

  let client: ALKS.Alks;
  let keys: any;

  try {
    client = await getALKSClient();
  } catch (e: any) {
    vscode.window.showErrorMessage(e?.message);
    return;
  }

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

const openConsole = async () => {
  console.log("<open console>");
  if (!(await validateSettings())) {
    return;
  }

  console.log("settings validated");
  let client: ALKS.Alks;
  let keys: any;

  console.log("get alks client");
  try {
    client = await getALKSClient();
  } catch (e: any) {
    vscode.window.showErrorMessage(e?.message);
    return;
  }

  const acct = await vscode.window.showQuickPick(
    AuthSettings.instance.getAccounts()!
  );
  const role = acct?.match(/(?<=\/).+?(?=\s)/g)?.[0];

  if (!acct || !role) {
    return vscode.window.showErrorMessage(
      'Invalid account selected. Account should be in format "#####/role - name"'
    );
  }

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

const handleRefreshToken = async (): Promise<boolean> => {
  const token = await vscode.window.showInputBox({
    placeHolder: "Refresh Token",
    prompt:
      "Please enter your ALKS refresh token. You can get this from the ALKS website.",
  });

  console.log(token);

  if (!token || !token.length) {
    return false;
  }

  try {
    console.log("Validating refresh token from user.");
    ALKS.getAccessToken({
      baseUrl: AuthSettings.instance.getServer(),
      refreshToken: token,
    });
  } catch (e: any) {
    console.error(`Invalid resource token supplied: ${e.message}`);
    return false;
  }

  console.log("Securely storing refresh token.");
  AuthSettings.instance.storeRefreshToken(token);

  return true;
};

const validateSettings = async (): Promise<boolean> => {
  console.log("Validating extension settings");

  if (!AuthSettings.instance.getServer()) {
    vscode.window.showErrorMessage("Please setup alks.server in settings.");
    return false;
  }

  const hasRefresh = await AuthSettings.instance.getRefreshToken();
  const accounts = AuthSettings.instance.getAccounts();

  if (!hasRefresh) {
    const refreshTokenSetup = await handleRefreshToken();
    if (!refreshTokenSetup) {
      vscode.window.showErrorMessage("Invalid refresh token.");
      return false;
    }
  } else if (!accounts || !Array.isArray(accounts) || !accounts.length) {
    vscode.window.showErrorMessage("Please setup alks.accounts in settings.");
    return false;
  }

  return true;
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
