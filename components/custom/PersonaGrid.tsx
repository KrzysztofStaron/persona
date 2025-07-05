"use client";

import React from "react";
import PersonaCard from "./PersonaCard";
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
  } = usePersonaContext();

  const statusMessage = getStatusMessage();

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

      <DebugButton onRegenerate={handleRegenerate} />
    </>
  );
};

export default PersonaGrid;
