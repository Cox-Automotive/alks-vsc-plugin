import { ExtensionContext, SecretStorage, window, workspace } from "vscode";
import { isValidRefreshToken } from "./alks";

export class AuthSettings {
  private static _instance: AuthSettings;
  private refreshToken: string | undefined;

  constructor(private secretStorage: SecretStorage) {}

  static init(context: ExtensionContext): void {
    AuthSettings._instance = new AuthSettings(context.secrets);
  }

  static get instance(): AuthSettings {
    return AuthSettings._instance;
  }

  async storeRefreshToken(token?: string): Promise<void> {
    if (token) {
      this.refreshToken = token;
      await this.secretStorage.store("alks_token", token);
    }
  }

  async getRefreshToken(): Promise<string | undefined> {
    if (!this.refreshToken) {
      this.refreshToken = await this.secretStorage.get("alks_token");
    }

    return this.refreshToken && this.refreshToken.length
      ? this.refreshToken
      : undefined;
  }

  async deleteRefreshToken(): Promise<void> {
    await this.secretStorage.store("alks_token", "");
    await this.secretStorage.delete("alks_token");
  }

  getServer(): string | undefined {
    return workspace.getConfiguration("alks").get("server");
  }

  getAccounts(): [string] | undefined {
    return workspace.getConfiguration("alks").get("accounts");
  }

  async validate(): Promise<void> {
    console.log("Validating extension settings");

    if (!this.getServer()) {
      throw new Error("Please setup alks.server in settings.");
    }

    const token = await this.getRefreshToken();

    if (token) {
      const validToken = await isValidRefreshToken(token);
      if (!validToken) {
        this.deleteRefreshToken();
        throw new Error("Invalid refresh token.");
      }
    } else {
      const token = await window.showInputBox({
        placeHolder: "Refresh Token",
        prompt:
          "Please enter your ALKS refresh token. You can get this from the ALKS website.",
      });

      if (!token || !token.length) {
        throw new Error("Please enter a refresh token to continue;");
      }

      const validToken = await isValidRefreshToken(token);
      if (!validToken) {
        throw new Error("Invalid refresh token.");
      }

      console.log("Securely storing refresh token.");

      this.storeRefreshToken(token);
    }

    const accounts = this.getAccounts();

    if (!accounts || !Array.isArray(accounts) || !accounts.length) {
      throw new Error("Please setup alks.accounts in settings.");
    }
  }
}
