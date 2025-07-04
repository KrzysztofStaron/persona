import { useState, useEffect } from "react";
import { Persona } from "@/types/persona";
import { generateAvatarForPersona } from "@/app/actions/generateAvatar";

interface AvatarState {
  url: string;
  isLoading: boolean;
  error: string | null;
}

// Simple in-memory cache for generated avatars
const avatarCache = new Map<string, string>();

export function useAvatarGeneration(persona: Persona): AvatarState {
  const [state, setState] = useState<AvatarState>({
    url: persona.image || "",
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    const generateAvatar = async () => {
      // If persona already has an image, use it
      if (persona.image) {
        setState({
          url: persona.image,
          isLoading: false,
          error: null,
        });
        return;
      }

      // Check cache first
      const cachedUrl = avatarCache.get(persona.name);
      if (cachedUrl) {
        setState({
          url: cachedUrl,
          isLoading: false,
          error: null,
        });
        return;
      }

      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const url = await generateAvatarForPersona(persona);

        // Cache the generated URL
        avatarCache.set(persona.name, url);

        setState({
          url,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("Failed to generate avatar:", error);
        setState({
          url: "",
          isLoading: false,
          error: "Failed to generate avatar",
        });
      }
    };

    generateAvatar();
  }, [persona]);

  return state;
}
