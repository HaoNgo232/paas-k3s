import { CookieStorage } from "./implementations";
import { IStorage } from "./storage.interface";

/**
 * Storage Factory
 * Singleton pattern để tái sử dụng storage instance
 */
class StorageFactory {
  private static instance: IStorage | null = null;

  static createStorage(): IStorage {
    if (!this.instance) {
      this.instance = new CookieStorage();
    }
    return this.instance;
  }

  static resetInstance(): void {
    this.instance = null;
  }
}

export const storage = StorageFactory.createStorage();
export { StorageFactory };
export * from "./storage.interface";
export * from "./implementations";
