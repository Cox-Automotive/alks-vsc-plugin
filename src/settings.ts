import { Account as ALKSAccount } from "alks.js";
import { ExtensionContext, SecretStorage, window, workspace } from "vscode";
import { getAccounts, isValidRefreshToken } from "./alks";
import { Cache } from "./cache";

/**
 * Settings class for managing extension settings and preferences.
 * @class
 */
export class Settings {
  private static _instance: Settings;
  private refreshToken: string | undefined;

  constructor(private secretStorage: SecretStorage) {}

  static init(context: ExtensionContext): void {
    Settings._instance = new Settings(context.secrets);
  }

  static get instance(): Settings {
    return Settings._instance;
  }

  /**
   * Stores ALKS refresh token in secret storage.
   * @param {string} token Refresh token
   */
  async storeRefreshToken(token?: string): Promise<void> {
    if (token) {
      console.log(
        "[settings:storeRefreshToken] Saving token to secret storage"
      );
      this.refreshToken = token;
      await this.secretStorage.store("alks_token", token);
      // Cache.instance.setCacheItem("alks_token", token);
      console.log("[settings:storeRefreshToken] token saved!");
    } else {
      console.warn(
        `[settings:storeRefreshToken] Tried to store invalid token: ${token}`
      );
    }
  }

  /**
   * Retrieves ALKS refresh token from secret storage.
   * @returns Promise<string> The refresh token.
   */
  async getRefreshToken(): Promise<string | undefined> {
    if (!this.refreshToken) {
      this.refreshToken = await this.secretStorage.get("alks_token");
      // this.refreshToken = Cache.instance.getCacheItem("alks_token");
    }

    console.log(`[settings:getRefreshToken]`);

    if (!this.refreshToken) {
      console.warn("[settings:getRefreshToken] Missing refresh token!");
      return undefined;
    } else if (!this.refreshToken.length) {
      console.warn("[settings:getRefreshToken] Empty refresh token!");
      return undefined;
    }

    return this.refreshToken;
  }

  /**
   * Deletes the refresh token from secret storage.
   */
  async deleteRefreshToken(): Promise<void> {
    await this.secretStorage.store("alks_token", "");
    await this.secretStorage.delete("alks_token");
    // Cache.instance.deleteCacheItem("alks_token");
    this.refreshToken = undefined;
  }

  /**
   * Retrieves the ALKS server URL from workspace configuration.
   * @returns {string} The server URL
   */
  getServer(): string | undefined {
    return workspace.getConfiguration("alks").get("server");
  }

  /**
   * Retrieves the workspace's ALKS accounts as well as the user's ALKS accounts.
   * @returns {string[]} Array of account names.
   */
  getAccounts(): string[] | undefined {
    const workspaceAccounts = workspace
      .getConfiguration("alks")
      .get("accounts") as string[];
    const allAccounts = Cache.instance
      .getCacheItem<ALKSAccount[]>("accounts")!
      .map((a) => a.account);

    return [
      ...workspaceAccounts,
      "--------------------------------",
      ...allAccounts,
    ];
  }

  /**
   * Validates settings are properly configured.
   * @throws Error On invalid or missing settings.
   */
  async validate(): Promise<void> {
    console.log("[settings:validate] Validating extension settings");

    if (!this.getServer()) {
      throw new Error("Please setup alks.server in settings.");
    }

    const token = await this.getRefreshToken();

    if (token) {
      console.log("[settings:validate] token good");
      const validToken = await isValidRefreshToken(token);
      if (!validToken) {
        await this.deleteRefreshToken();
        throw new Error("[settings:validate] Invalid refresh token.");
      }
    } else {
      console.log("[settings:validate] token no");
      const token = await window.showInputBox({
        placeHolder: "Refresh Token",
        prompt:
          "Please enter your ALKS refresh token. You can get this from the ALKS website.",
      });

      if (!token || !token.length) {
        return;
      }

      const validToken = await isValidRefreshToken(token);
      if (!validToken) {
        throw new Error("Invalid refresh token.");
      }

      console.log("[settings:validate] Securely storing refresh token.");
      await this.storeRefreshToken(token);

      const cache = Cache.instance;
      if (!cache.getCacheItem("accounts")) {
        console.log("[settings:validate] Caching accounts");
        try {
          const accounts = await getAccounts();
          cache.setCacheItem("accounts", accounts);
          console.log("[settings:validate] cached aws accounts");
        } catch (e: any) {
          console.error(
            "[settings:validate] Error getting accounts to cache: ${e.message"
          );
        }
      }
    }
    console.log("[settings:validate] COMPLETED");
  }
}
