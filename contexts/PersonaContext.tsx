"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Persona } from "@/types/persona";
import { generatePersonas } from "@/app/actions/generatePersonas";
import { generateAllAvatars } from "@/app/actions/generateAllAvatars";
import { devCache } from "@/lib/devCache";

interface PersonaContextType {
  personas: Persona[];
  isGeneratingPersonas: boolean;
  isGeneratingAvatars: boolean;
  error: string | null;
  isClientMounted: boolean;
  cacheExists: boolean;
  cacheExpirationHours: number;
  generateAll: (forceRegenerate?: boolean, theme?: string) => Promise<void>;
  handleRegenerate: () => void;
  getStatusMessage: () => string | null;
  updatePersona: (index: number, updatedPersona: Persona) => void;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

export const usePersonaContext = () => {
  const context = useContext(PersonaContext);
  if (context === undefined) {
    throw new Error("usePersonaContext must be used within a PersonaProvider");
  }
  return context;
};

interface PersonaProviderProps {
  children: ReactNode;
}

export const PersonaProvider: React.FC<PersonaProviderProps> = ({ children }) => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isGeneratingPersonas, setIsGeneratingPersonas] = useState(false);
  const [isGeneratingAvatars, setIsGeneratingAvatars] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [cacheExists, setCacheExists] = useState(false);
  const [cacheExpirationHours, setCacheExpirationHours] = useState(0);

  const loadFromCache = (): boolean => {
    const cached = devCache.load();
    if (cached) {
      setPersonas(cached.personas);
      return true;
    }
    return false;
  };

  const updateCacheStatus = () => {
    if (!isClientMounted) return;

    setCacheExists(devCache.exists());
    setCacheExpirationHours(getCacheExpirationHours());
  };

  const generateAll = async (forceRegenerate = false, theme?: string) => {
    try {
      setError(null);

      // Check cache first (unless forcing regeneration)
      if (!forceRegenerate && loadFromCache()) {
        updateCacheStatus();
        return;
      }

      // Generate personas
      setIsGeneratingPersonas(true);
      const newPersonas = await generatePersonas(4, theme || "realistic");
      setPersonas(newPersonas);
      setIsGeneratingPersonas(false);

      // Generate avatars
      setIsGeneratingAvatars(true);
      const avatarMap = await generateAllAvatars(newPersonas);

      // Update personas with avatars
      const personasWithAvatars = newPersonas.map(persona => ({
        ...persona,
        image: avatarMap[persona.name] || "",
      }));

      setPersonas(personasWithAvatars);
      setIsGeneratingAvatars(false);

      // Cache the results in development
      devCache.save(personasWithAvatars, avatarMap);
      updateCacheStatus();
    } catch (error) {
      console.error("Error generating personas/avatars:", error);
      setError("Failed to generate personas and avatars. Please try again.");
      setIsGeneratingPersonas(false);
      setIsGeneratingAvatars(false);
    }
  };

  const handleRegenerate = () => {
    devCache.clear();
    generateAll(true);
  };

  const getStatusMessage = (): string | null => {
    if (error) return error;
    if (isGeneratingPersonas) return "Creating unique personas...";
    if (isGeneratingAvatars) return "Generating avatars for each persona...";
    return null;
  };

  const getCacheExpirationHours = (): number => {
    if (!isClientMounted || !devCache.isDev()) return 0;
    try {
      const cached = localStorage.getItem("persona-dev-cache");
      if (!cached) return 0;
      const cacheData = JSON.parse(cached);
      const hoursRemaining = Math.round((24 * 60 * 60 * 1000 - (Date.now() - cacheData.timestamp)) / (60 * 60 * 1000));
      return Math.max(0, hoursRemaining);
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  useEffect(() => {
    if (isClientMounted) {
      updateCacheStatus();
      // Only load from cache if it exists, don't auto-generate
      if (devCache.exists()) {
        loadFromCache();
      }
    }
  }, [isClientMounted]);

  const updatePersona = (index: number, updatedPersona: Persona) => {
    setPersonas(prevPersonas => {
      const newPersonas = [...prevPersonas];
      newPersonas[index] = updatedPersona;

      // Update cache with new personas
      const currentCache = devCache.load();
      if (currentCache) {
        devCache.save(newPersonas, currentCache.avatars);
      }

      return newPersonas;
    });
  };

  const contextValue: PersonaContextType = {
    personas,
    isGeneratingPersonas,
    isGeneratingAvatars,
    error,
    isClientMounted,
    cacheExists,
    cacheExpirationHours,
    generateAll,
    handleRegenerate,
    getStatusMessage,
    updatePersona,
  };

  return <PersonaContext.Provider value={contextValue}>{children}</PersonaContext.Provider>;
};
