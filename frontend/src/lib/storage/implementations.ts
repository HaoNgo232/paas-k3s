import Cookies from "js-cookie";
import { IStorage, StorageOptions } from "@/lib/storage/storage.interface";

/**
 * Cookie Storage Implementation
 * Implements IStorage với js-cookie
 * 
 * ⚠️ SECURITY TRADE-OFF (MVP):
 * Cookies are JavaScript-accessible (NOT HttpOnly) để support Bearer token pattern.
 * 
 * Why this approach:
 * - ✅ Standard REST API với Authorization header
 * - ✅ Multi-client support (web, mobile, CLI)
 * - ✅ Industry-standard Bearer token pattern
 * - ✅ Easier debugging và testing
 * 
 * Security measures:
 * - ✅ Secure flag (HTTPS only in production)
 * - ✅ SameSite=lax (CSRF protection)
 * - ✅ Next.js built-in XSS protection
 * - ✅ Token validation before storage
 * 
 * Future enhancement:
 * - Plan to migrate to HttpOnly cookies for web client
 * - See: docs/ai/planning/feature-user-authentication.md
 *       "Security Enhancement Plan (Post-MVP)"
 */
export class CookieStorage implements IStorage {
  getItem(key: string): string | null {
    if (!globalThis.window) return null;
    return Cookies.get(key) || null;
  }

  setItem(key: string, value: string, options?: StorageOptions): void {
    if (!globalThis.window) return;

    Cookies.set(key, value, {
      expires: options?.expires || 7,
      secure: options?.secure ?? process.env.NODE_ENV === "production",
      sameSite: options?.sameSite || "lax",
    });
  }

  removeItem(key: string): void {
    if (!globalThis.window) return;
    Cookies.remove(key);
  }

  clear(): void {
    if (!globalThis.window) return;
    // Clear all cookies
    Object.keys(Cookies.get()).forEach((key) => {
      Cookies.remove(key);
    });
  }
}

/**
 * LocalStorage Implementation
 * Fallback cho môi trường không hỗ trợ cookies
 */
export class BrowserStorage implements IStorage {
  getItem(key: string): string | null {
    if (!globalThis.window) return null;
    return localStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    if (!globalThis.window) return;
    localStorage.setItem(key, value);
  }

  removeItem(key: string): void {
    if (!globalThis.window) return;
    localStorage.removeItem(key);
  }

  clear(): void {
    if (!globalThis.window) return;
    localStorage.clear();
  }
}
