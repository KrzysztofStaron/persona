"use server";

import { Persona } from "@/types/persona";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Utility function to sleep for a given number of milliseconds
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Exponential backoff retry logic
async function withRetry<T>(fn: () => Promise<T>, maxRetries: number = 3, baseDelay: number = 1000): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if it's a rate limit error (429)
      if (error.status === 429 && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000; // Add jitter
        console.log(`Rate limit hit. Retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        await sleep(delay);
        continue;
      }

      // For other errors or if we've exhausted retries, throw the error
      throw error;
    }
  }

  throw lastError!;
}

export async function generateAvatar(persona: Persona): Promise<string> {
  try {
    const prompt = `${persona.looks} \n\n Create a profile picture for this character, like for social media. 
    Make it realistic, not cartoonish. Preferably make it look like photoshoot.
    `;

    ///console.log("NODE_ENV:", process.env.NODE_ENV);

    const response = await withRetry(async () => {
      return await openai.images.generate({
        model: process.env.NODE_ENV === "production" ? "dall-e-3" : "dall-e-2",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      });
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error("No image URL received from OpenAI");
    }

    return imageUrl;
  } catch (error: any) {
    console.error("Error generating avatar:", error);

    // Provide more specific error messages
    if (error.status === 429) {
      throw new Error("Rate limit exceeded. Please try again in a few minutes.");
    } else if (error.status === 400) {
      throw new Error("Invalid request. Please check your persona description.");
    } else if (error.status === 401) {
      throw new Error("Authentication failed. Please check your API key.");
    } else if (error.status === 403) {
      throw new Error("Access denied. Please check your API permissions.");
    } else if (error.status >= 500) {
      throw new Error("OpenAI service is temporarily unavailable. Please try again later.");
    } else {
      throw new Error(`Failed to generate avatar: ${error.message || "Unknown error"}`);
    }
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
