"use server";

import { Persona } from "@/types/persona";
import { generateAvatarForPersona } from "./generateAvatar";

// Utility function to sleep for a given number of milliseconds
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function generateAllAvatars(personas: Persona[]): Promise<{ [key: string]: string }> {
  const avatarMap: { [key: string]: string } = {};

  // Process avatars sequentially to avoid rate limits
  for (const persona of personas) {
    try {
      if (persona.image) {
        // Skip if persona already has an image
        avatarMap[persona.name] = persona.image;
        continue;
      }

      console.log(`Generating avatar for ${persona.name}`);

      const avatarUrl = await generateAvatarForPersona(persona);
      console.log(`Generated avatar for ${persona.name}`);
      avatarMap[persona.name] = avatarUrl;

      // Add delay between requests to avoid rate limits
      // Only add delay if there are more personas to process
      if (personas.indexOf(persona) < personas.length - 1) {
        console.log("Adding delay to avoid rate limits...");
        await sleep(2000); // 2 second delay between requests
      }
    } catch (error) {
      console.error(`Failed to generate avatar for ${persona.name}:`, error);
      avatarMap[persona.name] = "";
    }
  }

  return avatarMap;
}
