/**
 * Storage Interface
 * Abstraction cho storage operations - dễ mock và test
 */
export interface IStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string, options?: StorageOptions): void;
  removeItem(key: string): void;
  clear(): void;
}

export interface StorageOptions {
  expires?: number; // days
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
}
