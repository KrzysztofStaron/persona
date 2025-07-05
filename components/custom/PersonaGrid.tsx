"use client";

import React, { useState } from "react";
import PersonaCard from "./PersonaCard";
import PersonaCardSkeleton from "./PersonaCardSkeleton";
import DebugButton from "./DebugButton";
import { usePersonaContext } from "@/contexts/PersonaContext";
import { devCache } from "@/lib/devCache";

const PersonaGrid: React.FC = () => {
  const {
    personas,
    error,
    isClientMounted,
    cacheExists,
    cacheExpirationHours,
    generateAll,
    handleRegenerate,
    getStatusMessage,
    isGeneratingPersonas,
    isGeneratingAvatars,
  } = usePersonaContext();

  const [theme, setTheme] = useState("");

  const statusMessage = getStatusMessage();
  const isLoading = isGeneratingPersonas || isGeneratingAvatars;

  const handleGenerateWithTheme = () => {
    if (theme.trim()) {
      generateAll(true, theme.trim());
      setTheme("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleGenerateWithTheme();
    }
  };

  return (
    <>
      {statusMessage && (
        <div className="mb-6">
          <p className={`text-zinc-400 ${error ? "text-red-400" : ""}`}>{statusMessage}</p>
          {isClientMounted && devCache.isDev() && cacheExists && (
            <p className="text-yellow-400 text-sm mt-1">
              💾 Using cached data (expires in {cacheExpirationHours} hours)
            </p>
          )}
        </div>
      )}

      {/* Theme input field - shown when no personas and not loading */}
      {personas.length === 0 && !isLoading && !error && (
        <div className="mb-8 p-6 bg-zinc-900 rounded-lg border border-zinc-800">
          <h2 className="text-xl font-semibold text-white mb-4">Create Your Personas</h2>
          <p className="text-zinc-400 mb-4">Enter a theme or topic to generate unique personas around. Be creative!</p>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="e.g., cyberpunk hackers, medieval knights, space explorers..."
              value={theme}
              onChange={e => setTheme(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleGenerateWithTheme}
              disabled={!theme.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Generate
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
        {personas.length > 0
          ? personas.map((persona, index) => (
              <PersonaCard key={`${persona.name}-${index}`} persona={persona} personaIndex={index} />
            ))
          : isLoading
          ? // Show skeleton cards while loading
            Array.from({ length: 4 }).map((_, index) => <PersonaCardSkeleton key={`skeleton-${index}`} />)
          : null}
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

      <DebugButton onRegenerate={handleRegenerate} />
    </>
  );
};

export default PersonaGrid;
