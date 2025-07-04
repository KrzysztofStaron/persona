import { Persona } from "@/types/persona";

interface CacheData {
  personas: Persona[];
  avatars: { [key: string]: string };
  timestamp: number;
}

const CACHE_KEY = "persona-dev-cache";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const devCache = {
  // Check if we're in development mode and localStorage is available
  isDev(): boolean {
    return typeof window !== "undefined" && window.location.hostname === "localhost";
  },

  // Save data to cache
  save(personas: Persona[], avatars: { [key: string]: string }): void {
    if (!this.isDev()) return;

    const cacheData: CacheData = {
      personas,
      avatars,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log("Dev cache saved:", { personaCount: personas.length, avatarCount: Object.keys(avatars).length });
    } catch (error) {
      console.warn("Failed to save to dev cache:", error);
    }
  },

  // Load data from cache
  load(): { personas: Persona[]; avatars: { [key: string]: string } } | null {
    if (!this.isDev()) return null;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const cacheData: CacheData = JSON.parse(cached);

      // Check if cache is still valid
      if (Date.now() - cacheData.timestamp > CACHE_DURATION) {
        this.clear();
        return null;
      }

      console.log("Dev cache loaded:", {
        personaCount: cacheData.personas.length,
        avatarCount: Object.keys(cacheData.avatars).length,
      });
      return {
        personas: cacheData.personas,
        avatars: cacheData.avatars,
      };
    } catch (error) {
      console.warn("Failed to load from dev cache:", error);
      return null;
    }
  },

  // Clear cache
  clear(): void {
    if (!this.isDev()) return;

    try {
      localStorage.removeItem(CACHE_KEY);
      console.log("Dev cache cleared");
    } catch (error) {
      console.warn("Failed to clear dev cache:", error);
    }
  },

  // Check if cache exists and is valid
  exists(): boolean {
    if (!this.isDev()) return false;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return false;

      const cacheData: CacheData = JSON.parse(cached);
      return Date.now() - cacheData.timestamp <= CACHE_DURATION;
    } catch (error) {
      return false;
    }
  },
};
