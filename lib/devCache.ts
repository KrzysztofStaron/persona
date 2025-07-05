import { Persona } from "@/types/persona";

interface CacheData {
  personas: Persona[];
  avatars: { [key: string]: string };
  timestamp: number;
}

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

type ChatHistory = {
  personaName: string;
  personaId: string;
  messages: ChatMessage[];
  lastActivity: number;
};

type ChatStorage = {
  [chatId: string]: ChatHistory;
};

const CACHE_KEY = "persona-dev-cache";
const CHAT_STORAGE_KEY = "persona-chat-storage";
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

  // Chat Storage Functions
  saveChatMessage(personaName: string, personaId: string, message: ChatMessage): void {
    if (typeof window === "undefined") return;

    try {
      const chatStorage = this.loadChatStorage();
      const chatId = `${personaName}-${personaId}`;

      if (!chatStorage[chatId]) {
        chatStorage[chatId] = {
          personaName,
          personaId,
          messages: [],
          lastActivity: Date.now(),
        };
      }

      chatStorage[chatId].messages.push(message);
      chatStorage[chatId].lastActivity = Date.now();

      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatStorage));
    } catch (error) {
      console.warn("Failed to save chat message:", error);
    }
  },

  loadChatHistory(personaName: string, personaId: string): ChatMessage[] {
    if (typeof window === "undefined") return [];

    try {
      const chatStorage = this.loadChatStorage();
      const chatId = `${personaName}-${personaId}`;
      return chatStorage[chatId]?.messages || [];
    } catch (error) {
      console.warn("Failed to load chat history:", error);
      return [];
    }
  },

  loadChatStorage(): ChatStorage {
    if (typeof window === "undefined") return {};

    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn("Failed to load chat storage:", error);
      return {};
    }
  },

  getAllChats(): ChatStorage {
    return this.loadChatStorage();
  },

  exportAllChatsAsJSON(): string {
    const chatStorage = this.getAllChats();
    const exportData = {
      exportDate: new Date().toISOString(),
      totalChats: Object.keys(chatStorage).length,
      chats: chatStorage,
    };
    return JSON.stringify(exportData, null, 2);
  },

  downloadAllChats(): void {
    if (typeof window === "undefined") return;

    try {
      const jsonData = this.exportAllChatsAsJSON();
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `persona-chats-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("Chat export downloaded");
    } catch (error) {
      console.error("Failed to download chats:", error);
    }
  },

  clearAllChats(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
      console.log("All chats cleared");
    } catch (error) {
      console.warn("Failed to clear chats:", error);
    }
  },
};
