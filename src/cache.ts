import { ExtensionContext } from "vscode";

/**
 * Singleton class for managing internal extension cache. Cache is stored in global state.
 * @class
 */
export class Cache {
  private static _instance: Cache;
  private _cacheName: string = "ALKS_cache";

  constructor(private state: ExtensionContext["globalState"]) {}

  /**
   * Initializes the singleton instance.
   * @param {ExtensionContext} context VS Code Plugin Context
   * @returns {Cache} Singleton instance
   */
  static init(context: ExtensionContext): Cache {
    Cache._instance = new Cache(context.globalState);

    return Cache._instance;
  }

  /**
   * Returns the singleton instance.
   */
  static get instance(): Cache {
    return Cache._instance;
  }

  /**
   * Returns a cached item.
   * @param {string} key Key of cached item
   * @returns {<T>} Cached item
   */
  getCacheItem<T>(key: string): T | undefined {
    return this.state.get<T>(key);
  }

  /**
   * Caches an item.
   * @param {string} key Key to cache under
   * @param {<T>} value Item to cache
   */
  setCacheItem<T>(key: string, value: T): void {
    this.state.update(key, value);
  }
}
