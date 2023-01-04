import { ExtensionContext } from "vscode";

export class Cache {
  private static _instance: Cache;
  private _cacheName: string = "ALKS_cache";

  constructor(private state: ExtensionContext["globalState"]) {}

  static init(context: ExtensionContext): Cache {
    Cache._instance = new Cache(context.globalState);

    return Cache._instance;
  }

  static get instance(): Cache {
    return Cache._instance;
  }

  getCacheItem<T>(key: string): T | undefined {
    return this.state.get<T>(key);
  }

  setCacheItem<T>(key: string, value: T): void {
    this.state.update(key, value);
  }
}
