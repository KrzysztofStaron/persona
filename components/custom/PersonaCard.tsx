"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Persona } from "@/types/persona";
import PersonaChat from "./PersonaChat";
import PersonaCardSkeleton from "./PersonaCardSkeleton";
import { usePersonaContext } from "@/contexts/PersonaContext";
import { generateAvatar } from "@/app/actions/generateAvatar";

interface PersonaCardProps {
  persona: Persona;
  personaIndex: number;
}

const PersonaCard: React.FC<PersonaCardProps> = ({ persona, personaIndex }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const { updatePersona, isGeneratingPersonas, isGeneratingAvatars } = usePersonaContext();

  useEffect(() => {
    if (persona.image) {
      setIsImageLoading(true);
    } else {
      setIsImageLoading(false);
    }
  }, [persona.image]);

  // Only show skeleton when personas are being generated (not just avatars)
  if (isGeneratingPersonas) {
    return <PersonaCardSkeleton />;
  }

  const handleCardClick = () => {
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  const handlePersonaUpdated = (updatedPersona: Persona) => {
    updatePersona(personaIndex, updatedPersona);
  };

  const handleRegenerateAvatar = async () => {
    console.log("Manually regenerating avatar for", persona.name);

    try {
      const newAvatarUrl = await generateAvatar(persona);

      if (newAvatarUrl) {
        const updatedPersona = {
          ...persona,
          image: newAvatarUrl,
        };
        updatePersona(personaIndex, updatedPersona);
      }
    } catch (error: any) {
      console.error("Error regenerating avatar:", error);

      // Could show a toast notification here for better UX
      console.log("Avatar generation failed:", error.message);
    }
  };

  const handleCopyJson = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click

    try {
      const personaJson = JSON.stringify(persona, null, 2);
      await navigator.clipboard.writeText(personaJson);

      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy JSON:", err);
    }
  };

  return (
    <>
      <Card
        className="pl-4 transition-all duration-200 h-full cursor-pointer border-zinc-700 relative opacity-75 hover:opacity-100 hover:border-zinc-600"
        onClick={handleCardClick}
      >
        {/* Copy JSON Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 z-10 h-8 w-8 p-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
          onClick={handleCopyJson}
          title="Copy JSON"
        >
          {isCopied ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </Button>

        <CardContent className="p-4 h-full">
          <div className="flex items-start gap-3 h-full">
            {/* Avatar */}
            <div className="w-18 aspect-[3/4] rounded-md overflow-hidden flex items-center justify-center bg-zinc-800">
              {persona.image && isImageLoading ? (
                <>
                  <Skeleton className="w-full h-full" />

                  <img
                    src={persona.image}
                    alt={persona.name}
                    className="w-full h-full object-cover hidden"
                    onLoad={() => setIsImageLoading(false)}
                  />
                </>
              ) : persona.image ? (
                <img
                  src={persona.image}
                  alt={persona.name}
                  className="w-full h-full object-cover"
                  onLoad={() => setIsImageLoading(false)}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-400">
                  <p className="text-2xl font-bold">{persona.name.charAt(0)}</p>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Name */}
              <h3 className="text-white font-semibold text-lg leading-tight">{persona.name}</h3>

              {/* Personality Badges */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {persona.personality.map((trait, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs bg-zinc-700 text-zinc-200 hover:bg-zinc-600 border-zinc-600"
                  >
                    {trait}
                  </Badge>
                ))}
              </div>

              {/* Biography/Description */}
              <p className="text-zinc-300 text-sm mt-3 leading-relaxed">{persona.biography}</p>

              {/* Chat indicator */}
              <div className="mt-3 pt-2 border-t border-zinc-700">
                <p className="text-zinc-500 text-xs font-medium">Click to chat with {persona.name}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <PersonaChat
        persona={persona}
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        onPersonaUpdated={handlePersonaUpdated}
      />
    </>
  );
};

export default PersonaCard;
