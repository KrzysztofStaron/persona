"use server";

import { Persona } from "@/types/persona";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateAvatar(persona: Persona): Promise<string> {
  try {
    const prompt = `${JSON.stringify(
      persona
    )} \n\n Create a profile picture for this character, like for social media.`;

    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt: prompt,
      n: 1,
      size: "256x256",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error("No image URL received from OpenAI");
    }

    return imageUrl;
  } catch (error) {
    console.error("Error generating avatar:", error);
    throw new Error("Failed to generate avatar");
  }
}

export async function generateAvatarForPersona(persona: Persona): Promise<string> {
  //return "https://placehold.co/256x256";

  try {
    const avatarUrl = await generateAvatar(persona);
    return avatarUrl;
  } catch (error) {
    console.error(`Failed to generate avatar for ${persona.name}:`, error);
    // Return a fallback or throw the error
    throw error;
  }
}
