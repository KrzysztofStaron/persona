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
  const [isRegeneratingAvatar, setIsRegeneratingAvatar] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const { updatePersona, isGeneratingPersonas, isGeneratingAvatars } = usePersonaContext();

  const handleImageError = async () => {
    if (isRegeneratingAvatar) return; // Prevent infinite loops

    console.log("Image failed to load for", persona.name);
    setImageError(true);
    setIsImageLoading(false); // Stop loading state immediately

    // Don't auto-regenerate if it's just an expired URL
    // User can manually regenerate by clicking the card if needed
    console.log("Image URL may be expired. Showing fallback avatar.");
  };

  const handleImageLoad = () => {
    setImageError(false);
    setIsImageLoading(false);
    console.log("Image loaded successfully for", persona.name);
  };

  useEffect(() => {
    if (persona.image === "") {
      handleImageError();
    } else {
      // Reset loading state when persona has an image
      setIsImageLoading(true);
      setImageError(false);
    }
  }, [persona, handleImageError]);

  useEffect(() => {
    // Reset image loading state when persona image changes
    if (persona.image) {
      setIsImageLoading(true);
      setImageError(false);
    } else {
      // If no image, don't show loading state
      setIsImageLoading(false);
    }
  }, [persona.image]);

  // If all personas are being regenerated, show full skeleton
  if (isGeneratingPersonas || isGeneratingAvatars) {
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
    if (isRegeneratingAvatar) return;

    console.log("Manually regenerating avatar for", persona.name);
    setIsRegeneratingAvatar(true);

    try {
      const newAvatarUrl = await generateAvatar(persona);

      if (newAvatarUrl) {
        const updatedPersona = {
          ...persona,
          image: newAvatarUrl,
        };
        updatePersona(personaIndex, updatedPersona);
        setImageError(false);
        setIsImageLoading(true); // Reset loading state for new image
      }
    } catch (error: any) {
      console.error("Error regenerating avatar:", error);

      // Show more specific error messages
      let errorMessage = "Error: Could not generate avatar";

      if (error.message) {
        if (error.message.includes("Rate limit exceeded")) {
          errorMessage = "Rate limit exceeded. Please try again in a few minutes.";
        } else if (error.message.includes("Authentication failed")) {
          errorMessage = "Authentication error. Please check API configuration.";
        } else if (error.message.includes("temporarily unavailable")) {
          errorMessage = "Service temporarily unavailable. Please try again later.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      // For rate limit errors, don't set image error (keep showing fallback initials)
      // For other errors, show the error message
      if (!error.message?.includes("Rate limit exceeded")) {
        setImageError(true);
      }

      // Could show a toast notification here for better UX
      console.log("Avatar generation failed:", errorMessage);
    } finally {
      setIsRegeneratingAvatar(false);
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
        className="pl-4 transition-all duration-200 h-full cursor-pointer hover:bg-zinc-800/50 hover:border-zinc-600 border-zinc-700 relative"
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
            <div className="w-18 aspect-[3/4] rounded-md overflow-hidden flex items-center justify-center bg-zinc-800 relative">
              {isRegeneratingAvatar || isImageLoading ? (
                <Skeleton className="w-full h-full" />
              ) : persona.image && !imageError ? (
                <img
                  key={persona.image}
                  src={persona.image}
                  alt={persona.name}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-400 group">
                  <p className="text-2xl font-bold mb-1">{persona.name.charAt(0)}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      handleRegenerateAvatar();
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                    disabled={isRegeneratingAvatar}
                  >
                    {imageError ? "Generate" : "Add Image"}
                  </Button>
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
                <p className="text-blue-400 text-xs font-medium">Click to chat with {persona.name}</p>
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
