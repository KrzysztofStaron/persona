"use server";

import { Persona } from "@/types/persona";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generatePersonas(count: number = 4, theme: string = "realistic"): Promise<Persona[]> {
  try {
    const prompt = `Generate ${count} unique character personas based on the theme: "${theme}". Don't make them 100% bad nor 100% good. Each should be a JSON object with the following structure:
 characters: [
    {
  "name": "Character Name",
  "age": number,
  "looks": "detailed physical description for profile picture generation",
  "biography": "character background story", // 1-2 sentences max, could be morally unethical,
  "lifeGoals": "character's main objectives", // could be morally unethical,
  "hobbies": ["hobby1", "hobby2", ...], // cound be 1-4,
  "responseTone": ["tone1", "tone2"], // cound be 1-4,
  "personality": ["trait1", "trait2", ...], // cound be 1-4,
}
  ]

Make each character unique with diverse backgrounds, ages, and personalities. Focus on the "${theme}" theme. Ensure the "looks" field is detailed enough for AI image generation. Return as a JSON array.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `You are a creative character designer. Generate unique, interesting personas based on the theme: "${theme}". Return valid JSON only.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    console.log(content);

    // Parse the JSON response
    const personas: Partial<Persona>[] = JSON.parse(content).characters;

    // Validate the structure
    if (!Array.isArray(personas)) {
      throw new Error("Invalid persona structure received");
    }

    return personas.map(persona => ({
      ...persona,
      image: "",
    })) as Persona[];
  } catch (error) {
    console.error("Error generating personas:", error);
    // Return fallback personas if generation fails
    return getFallbackPersonas();
  }
}

function getFallbackPersonas(): Persona[] {
  return [
    {
      name: "Zara Nightwhisper",
      age: 150,
      image: "",
      looks:
        "Mysterious figure with silver hair that shimmers like starlight and deep purple eyes, adorned in flowing dark robes",
      biography: "Guardian of the Ethereal Realm, protector of dreams and keeper of forgotten memories.",
      lifeGoals: "To bridge the gap between the waking world and the realm of dreams",
      hobbies: ["dream weaving", "stargazing", "collecting whispered secrets", "moon dancing"],
      responseTone: ["mystical", "enigmatic"],
      personality: ["wise", "mysterious", "compassionate", "otherworldly"],
    },
    {
      name: "Kai Stormforge",
      age: 32,
      image: "",
      looks:
        "Rugged inventor with copper-colored hair and goggles permanently perched on their forehead, hands stained with oil and magic",
      biography:
        "Legendary artificer who creates magical machines powered by elemental forces, revolutionizing the intersection of magic and technology.",
      lifeGoals: "To create the perfect fusion of magic and machinery that will bring prosperity to all realms",
      hobbies: ["tinkering", "storm chasing", "elemental channeling", "mechanical sketching"],
      responseTone: ["enthusiastic", "inventive"],
      personality: ["innovative", "determined", "adventurous", "perfectionist"],
    },
    {
      name: "Luna Thornfield",
      age: 28,
      image: "",
      looks:
        "Elegant botanist with emerald eyes and hair adorned with living vines, always surrounded by a subtle floral aroma",
      biography:
        "Master herbalist and plant whisperer who can communicate with flora and creates miraculous healing potions.",
      lifeGoals: "To discover the lost language of ancient trees and restore balance to nature",
      hobbies: ["plant telepathy", "potion brewing", "forest meditation", "seed collecting"],
      responseTone: ["nurturing", "wise"],
      personality: ["empathetic", "patient", "intuitive", "protective"],
    },
    {
      name: "Phoenix Ashcroft",
      age: 45,
      image: "",
      looks:
        "Charismatic chef with flame-red hair and eyes that sparkle with warmth, wearing an apron that never seems to get dirty",
      biography:
        "Renowned culinary wizard who infuses emotions into food, creating dishes that can heal hearts and lift spirits.",
      lifeGoals: "To open a restaurant that serves not just food, but hope and happiness to all who enter",
      hobbies: ["emotional cooking", "recipe archaeology", "taste meditation", "ingredient storytelling"],
      responseTone: ["warm", "comforting"],
      personality: ["nurturing", "creative", "optimistic", "generous"],
    },
  ];
}
