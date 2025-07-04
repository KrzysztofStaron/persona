"use server";

import { Persona } from "@/types/persona";
import { generateAvatarForPersona } from "./generateAvatar";

export async function generateAllAvatars(personas: Persona[]): Promise<{ [key: string]: string }> {
  const avatarPromises = personas.map(async persona => {
    try {
      if (persona.image) {
        // Skip if persona already has an image
        return { name: persona.name, url: persona.image };
      }

      console.log(`Generating avatar for ${persona.name}`);

      const avatarUrl = await generateAvatarForPersona(persona);
      console.log(`Generated avatar for ${persona.name}`);
      return { name: persona.name, url: avatarUrl };
    } catch (error) {
      console.error(`Failed to generate avatar for ${persona.name}:`, error);
      return { name: persona.name, url: "" };
    }
  });

  const results = await Promise.all(avatarPromises);

  // Convert to object with persona names as keys
  const avatarMap: { [key: string]: string } = {};
  results.forEach(result => {
    avatarMap[result.name] = result.url;
  });

  return avatarMap;
}
