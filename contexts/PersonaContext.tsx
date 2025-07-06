"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Persona } from "@/types/persona";
import { generatePersonas, getFallbackPersonas } from "@/app/actions/generatePersonas";
import { generateAvatar } from "@/app/actions/generateAvatar";
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

  const loadFallbackPersonas = async () => {
    try {
      const fallbackPersonas = await getFallbackPersonas(4);
      setPersonas(fallbackPersonas);
    } catch (error) {
      console.error("Error loading fallback personas:", error);
    }
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

      // Only generate if explicitly requested (forceRegenerate = true)
      if (!forceRegenerate) {
        updateCacheStatus();
        return;
      }

      // Generate personas
      setIsGeneratingPersonas(true);
      const newPersonas = await generatePersonas(4, theme || "realistic");

      // Display personas immediately (without avatars)
      setPersonas(newPersonas);
      setIsGeneratingPersonas(false);

      // Generate avatars in the background
      setIsGeneratingAvatars(true);

      // Generate avatars one by one and update personas individually
      generateAvatarsInBackground(newPersonas);
    } catch (error) {
      console.error("Error generating personas:", error);
      setError("Failed to generate personas. Please try again.");
      setIsGeneratingPersonas(false);
      setIsGeneratingAvatars(false);
    }
  };

  const generateAvatarsInBackground = async (personasToUpdate: Persona[]) => {
    try {
      // Generate avatars one by one and update personas individually
      for (let i = 0; i < personasToUpdate.length; i++) {
        const persona = personasToUpdate[i];

        try {
          const avatarUrl = await generateAvatar(persona);

          // Update this specific persona with its avatar
          setPersonas(prevPersonas => {
            const newPersonas = [...prevPersonas];
            const personaIndex = newPersonas.findIndex(p => p.name === persona.name);
            if (personaIndex !== -1) {
              newPersonas[personaIndex] = {
                ...newPersonas[personaIndex],
                image: avatarUrl || "",
              };
            }
            return newPersonas;
          });
        } catch (error) {
          console.error(`Failed to generate avatar for ${persona.name}:`, error);
          // Continue with other personas even if one fails
        }
      }

      setIsGeneratingAvatars(false);

      // Cache the final result
      setPersonas(prevPersonas => {
        const avatarMap: { [key: string]: string } = {};
        prevPersonas.forEach(persona => {
          avatarMap[persona.name] = persona.image;
        });
        devCache.save(prevPersonas, avatarMap);
        return prevPersonas;
      });

      updateCacheStatus();
    } catch (error) {
      console.error("Error generating avatars:", error);
      setIsGeneratingAvatars(false);
      // Don't show error for avatar failures, personas are already visible
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
      // Load from cache if it exists, otherwise load fallback personas
      if (devCache.exists()) {
        loadFromCache();
      } else {
        // Load fallback personas as defaults when no cache exists
        loadFallbackPersonas();
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
