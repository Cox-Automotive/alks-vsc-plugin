import * as ALKS from "alks.js";
import * as vscode from "vscode";
import { generateConsoleUrl } from "./alks-console";

const alksParams = {
  baseUrl: "", // FIXME
  userAgent: "vsc-plugin",
};

const account = ""; // FIXME
const role = ""; // FIXME
const refreshToken = ""; // FIXME

const getALKSClient = async (): Promise<ALKS.Alks> => {
  let client: ALKS.Alks;
  let accessToken: ALKS.AccessToken;

  try {
    client = ALKS.create(alksParams as ALKS.AlksProps);
    console.log("Exchanging refresh token for access token.");
    accessToken = await client.getAccessToken({
      refreshToken,
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
      ...alksParams,
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

  vscode.window.showInformationMessage(JSON.stringify(keys));
};

const newConsole = async () => {
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

  context.subscriptions.push(
    vscode.commands.registerCommand("alks-vsc.newSession", newSession)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("alks-vsc.newConsole", newConsole)
  );
}

export function deactivate() {}
