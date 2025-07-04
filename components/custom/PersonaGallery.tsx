"use client";

import React, { useState, useEffect } from "react";
import { Persona } from "@/types/persona";
import PersonaCard from "./PersonaCard";
import DebugButton from "./DebugButton";
import { generatePersonas } from "@/app/actions/generatePersonas";
import { generateAllAvatars } from "@/app/actions/generateAllAvatars";
import { devCache } from "@/lib/devCache";

const PersonaGallery: React.FC = () => {
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

  const generateAll = async (forceRegenerate = false) => {
    try {
      setError(null);

      // Check cache first (unless forcing regeneration)
      if (!forceRegenerate && loadFromCache()) {
        updateCacheStatus();
        return;
      }

      // Generate personas
      setIsGeneratingPersonas(true);
      const newPersonas = await generatePersonas(4);
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

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  useEffect(() => {
    if (isClientMounted) {
      updateCacheStatus();
      generateAll();
    }
  }, [isClientMounted]);

  const getStatusMessage = () => {
    if (error) return error;
    if (isGeneratingPersonas) return "Creating unique personas...";
    if (isGeneratingAvatars) return "Generating avatars for each persona...";
    if (personas.length === 0) return "Loading...";
    return "Explore different personalities and their unique characteristics";
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

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Persona Gallery</h1>
          <p className={`text-zinc-400 ${error ? "text-red-400" : ""}`}>{getStatusMessage()}</p>
          {isClientMounted && devCache.isDev() && cacheExists && (
            <p className="text-yellow-400 text-sm mt-1">
              💾 Using cached data (expires in {cacheExpirationHours} hours)
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
          {personas.map((persona, index) => (
            <PersonaCard key={`${persona.name}-${index}`} persona={persona} />
          ))}
        </div>

        {error && (
          <div className="mt-8 text-center">
            <button
              onClick={() => generateAll(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <DebugButton onRegenerate={handleRegenerate} />
    </>
  );
};

export default PersonaGallery;
