"use client";

import React, { useState } from "react";
import PersonaCard from "./PersonaCard";
import PersonaCardSkeleton from "./PersonaCardSkeleton";
import DebugButton from "./DebugButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
    getStatusMessage,
    isGeneratingPersonas,
    isGeneratingAvatars,
  } = usePersonaContext();

  const [theme, setTheme] = useState("");
  const [count, setCount] = useState(4);
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [regenerateTheme, setRegenerateTheme] = useState("");
  const [regenerateCount, setRegenerateCount] = useState(4);

  const statusMessage = getStatusMessage();
  const isLoading = isGeneratingPersonas || isGeneratingAvatars;
  const isGeneratingPersonasOnly = isGeneratingPersonas;

  const handleGenerateWithTheme = () => {
    if (theme.trim()) {
      generateAll(true, theme.trim(), count);
      setTheme("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleGenerateWithTheme();
    }
  };

  const handleDebugRegenerate = (theme?: string) => {
    generateAll(true, theme, count);
  };

  const handleRegenerateSubmit = () => {
    generateAll(true, regenerateTheme.trim() || undefined, regenerateCount);
    setIsRegenerateDialogOpen(false);
    setRegenerateTheme("");
    setRegenerateCount(4);
  };

  const handleRegenerateCancel = () => {
    setIsRegenerateDialogOpen(false);
    setRegenerateTheme("");
    setRegenerateCount(4);
  };

  const handleRegenerateKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRegenerateSubmit();
    }
  };

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= 30) {
      setCount(value);
    }
  };

  const handleRegenerateCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= 30) {
      setRegenerateCount(value);
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
      {personas.length === 0 && !isLoading && (
        <div className="mb-8 p-6 bg-zinc-900 rounded-lg border border-zinc-800">
          <h2 className="text-xl font-semibold text-white mb-4">Create Your Personas</h2>
          <p className="text-zinc-400 mb-4">Enter a theme or topic to generate unique personas around. Be creative!</p>
          <div className="flex gap-3 mb-4">
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
              className="px-6 py-2 bg-accent hover:bg-accent/80 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Generate
            </button>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="count" className="text-sm text-zinc-400 font-medium">
              Number of personas:
            </label>
            <input
              id="count"
              type="number"
              min="1"
              max="30"
              value={count}
              onChange={handleCountChange}
              className="w-20 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
            <span className="text-xs text-zinc-500">(max 30)</span>
          </div>
        </div>
      )}

      {/* Regenerate button - shown when personas exist and not generating personas */}
      {personas.length > 0 && !isGeneratingPersonasOnly && (
        <div className="mb-6 flex flex-col items-center gap-2">
          {!cacheExists && (
            <p className="text-zinc-500 text-sm">✨ Showing default personas - click below to generate custom ones</p>
          )}
          <Button
            onClick={() => setIsRegenerateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
            variant="outline"
          >
            🔄 Create new characters
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
        {personas.length > 0
          ? personas.map((persona, index) => (
              <PersonaCard key={`${persona.name}-${index}`} persona={persona} personaIndex={index} />
            ))
          : isGeneratingPersonasOnly
          ? // Show skeleton cards while generating personas
            Array.from({ length: count }).map((_, index) => <PersonaCardSkeleton key={`skeleton-${index}`} />)
          : null}
      </div>

      {error && (
        <div className="mt-8 text-center">
          <button
            onClick={() => generateAll(true, undefined, count)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      )}

      <DebugButton onRegenerate={handleDebugRegenerate} />

      {/* Regenerate Dialog */}
      <Dialog open={isRegenerateDialogOpen} onOpenChange={setIsRegenerateDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-white">Regenerate All Personas</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Enter a new theme to generate fresh personas around. Leave empty to use the default theme.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div>
              <input
                type="text"
                placeholder="e.g., cyberpunk hackers, medieval knights, space explorers..."
                value={regenerateTheme}
                onChange={e => setRegenerateTheme(e.target.value)}
                onKeyPress={handleRegenerateKeyPress}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="regenerate-count" className="text-sm text-zinc-400 font-medium">
                Number of personas:
              </label>
              <input
                id="regenerate-count"
                type="number"
                min="1"
                max="30"
                value={regenerateCount}
                onChange={handleRegenerateCountChange}
                className="w-20 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
              <span className="text-xs text-zinc-500">(max 30)</span>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleRegenerateCancel} className="bg-zinc-600 hover:bg-zinc-700 text-white">
              Cancel
            </Button>
            <Button onClick={handleRegenerateSubmit} className="bg-accent hover:bg-accent/80 text-white">
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PersonaGrid;
