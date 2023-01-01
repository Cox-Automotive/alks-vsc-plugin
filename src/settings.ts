import * as vscode from "vscode";

export interface Settings {
  server: string;
  accounts: [string];
  token: string;
}

export function getSettings(): Settings {
  const config = vscode.workspace.getConfiguration("alks");
  const server = config.get("server");
  const token = config.get("token");
  const accounts = config.get("accounts");

  return {
    server,
    accounts,
    token,
  } as Settings;
}
