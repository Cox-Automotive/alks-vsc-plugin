import { ExtensionContext, SecretStorage, workspace } from "vscode";

export class AuthSettings {
  private static _instance: AuthSettings;

  constructor(private secretStorage: SecretStorage) {}

  static init(context: ExtensionContext): void {
    AuthSettings._instance = new AuthSettings(context.secrets);
  }

  static get instance(): AuthSettings {
    return AuthSettings._instance;
  }

  async storeRefreshToken(token?: string): Promise<void> {
    if (token) {
      await this.secretStorage.store("alks_token", token);
    }
  }

  async getRefreshToken(): Promise<string | undefined> {
    await this.secretStorage.get("alks_token"); // FIXME: if we dont call get() once before the real call we get undefined back.. race condition somewhere?
    return await this.secretStorage.get("alks_token");
  }

  async deleteRefreshToken(): Promise<void> {
    await this.secretStorage.delete("alks_token");
  }

  getServer(): string | undefined {
    return workspace.getConfiguration("alks").get("server");
  }

  getAccounts(): [string] | undefined {
    return workspace.getConfiguration("alks").get("accounts");
  }
}
