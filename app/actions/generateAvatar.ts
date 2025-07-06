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
    // Sanitize and simplify the persona description
    const sanitizedLooks = persona.looks
      .replace(/magic|magical|mystical|otherworldly|ethereal/gi, "enchanting")
      .replace(/cybernetic|implants|circuits/gi, "tech accessories")
      .replace(/ritual scars|scars/gi, "markings")
      .replace(/gladiator|warrior|fighter/gi, "athletic person")
      .replace(/weapon|sword|blade/gi, "tool")
      .replace(/hacker|cyber/gi, "tech enthusiast")
      .replace(/translucent|floating/gi, "graceful");

    let prompt = `Professional portrait photo of ${sanitizedLooks}. High quality studio lighting, photorealistic, detailed facial features, clean background, professional headshot style.`;

    console.log("Generated prompt:", prompt);

    try {
      // Try the detailed prompt first
      const response = await withRetry(async () => {
        return await openai.images.generate({
          model: process.env.NODE_ENV === "production" ? "dall-e-3" : "dall-e-2",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: process.env.NODE_ENV === "production" ? "standard" : undefined,
          style: process.env.NODE_ENV === "production" ? "natural" : undefined,
        });
      });

      const imageUrl = response.data?.[0]?.url;
      if (!imageUrl) {
        throw new Error("No image URL received from OpenAI");
      }

      return imageUrl;
    } catch (detailedError: any) {
      // If detailed prompt fails, try a simpler version
      if (detailedError.status === 400) {
        console.log("Detailed prompt failed, trying simplified version...");

        const simplifiedPrompt = `Professional headshot photo of a person. High quality studio lighting, photorealistic, clean background.`;

        const fallbackResponse = await withRetry(async () => {
          return await openai.images.generate({
            model: process.env.NODE_ENV === "production" ? "dall-e-3" : "dall-e-2",
            prompt: simplifiedPrompt,
            n: 1,
            size: "1024x1024",
            quality: process.env.NODE_ENV === "production" ? "standard" : undefined,
            style: process.env.NODE_ENV === "production" ? "natural" : undefined,
          });
        });

        const fallbackImageUrl = fallbackResponse.data?.[0]?.url;
        if (!fallbackImageUrl) {
          throw new Error("No image URL received from OpenAI");
        }

        return fallbackImageUrl;
      }

      // If it's not a 400 error, re-throw the original error
      throw detailedError;
    }
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
  try {
    const avatarUrl = await generateAvatar(persona);
    return avatarUrl;
  } catch (error: any) {
    console.error(`Failed to generate avatar for ${persona.name}:`, error);

    // Log the full error details for debugging
    if (error.status) {
      console.error(`Status: ${error.status}, Type: ${error.type || "unknown"}`);
    }

    // For development, we could return a placeholder instead of failing completely
    // Uncomment the line below if you want fallback placeholders:
    // return `https://ui-avatars.com/api/?name=${encodeURIComponent(persona.name)}&background=random&size=256`;

    throw error;
  }
}
