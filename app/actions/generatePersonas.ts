"use server";

import { Persona } from "@/types/persona";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "Persona Chat App",
  },
});

export async function generatePersonas(
  count: number = 4,
  theme: string = "realistic",
  question?: string
): Promise<Persona[]> {
  try {
    // 50:50 chance for good vs neutral personas
    const isGoodPersona = Math.random() < 0.5;

    let moralityInstruction = "";
    if (isGoodPersona) {
      // 50:50 chance between 100% good and 75% good
      const is100PercentGood = Math.random() < 0.5;
      if (is100PercentGood) {
        moralityInstruction =
          "Make these characters 100% good - pure, virtuous, and morally upright with no flaws or dark sides.";
      } else {
        moralityInstruction =
          "Make these characters 75% good - mostly virtuous and morally upright but with minor flaws or imperfections that make them human.";
      }
    } else {
      moralityInstruction =
        "Don't make them 100% bad nor 100% good. Give them a balanced mix of positive and negative traits.";
    }

    let prompt: string;

    if (question) {
      // Question-driven persona generation
      prompt = `Generate ${count} unique character personas who would have DIFFERENT and DIVERSE perspectives on this question: "${question}". ${moralityInstruction}

Create personas with varied backgrounds, expertise, and viewpoints that would lead to interesting, contrasting answers. Each should be a JSON object with the following structure:

characters: [
  {
    "name": "Character Name", // just name, not middle name or surname
    "age": number,
    "looks": "detailed physical description for profile picture generation",
    "biography": "character background story relevant to their perspective on the question", // 1-2 sentences max
    "lifeGoals": "character's main objectives related to their expertise/background",
    "hobbies": ["hobby1", "hobby2", ...], // could be 1-4
    "responseTone": ["tone1", "tone2"], // could be 1-4
    "personality": ["trait1", "trait2", ...], // could be 1-4
  }
]

Examples of diverse perspectives for different questions:
- Business question: entrepreneur, employee, consultant, economist
- Health question: doctor, patient, fitness trainer, researcher
- Technology question: developer, user, ethicist, futurist

Make each character unique with diverse backgrounds, ages, and personalities that would naturally have different viewpoints on: "${question}". Ensure the "looks" field is detailed enough for AI image generation. Return as a JSON array.`;
    } else {
      // Theme-driven persona generation (original behavior)
      prompt = `Generate ${count} unique character personas based on the theme: "${theme}". ${moralityInstruction} Each should be a JSON object with the following structure:
 characters: [
    {
  "name": "Character Name", // just name, not middle name or surname
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
    }

    const systemContent = question
      ? `You are a creative character designer. Generate unique, interesting personas with DIVERSE PERSPECTIVES who would have different viewpoints on the question: "${question}". ${moralityInstruction} Create characters with varied backgrounds and expertise that would lead to contrasting, thoughtful answers. Return valid JSON only.`
      : `You are a creative character designer. Generate unique, interesting personas based on the theme: "${theme}". ${moralityInstruction} Return valid JSON only.`;

    const response = await openai.chat.completions.create({
      model: "google/gemini-flash-1.5",
      messages: [
        {
          role: "system",
          content: systemContent,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.9,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from Google AI Studio");
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
    return await getFallbackPersonas(count);
  }
}

export async function getFallbackPersonas(count: number = 4): Promise<Persona[]> {
  // Pool of 10 diverse personas
  const personaPool: Persona[] = [
    {
      name: "Zara",
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
      name: "Kai",
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
      name: "Luna",
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
      name: "Phoenix",
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
    {
      name: "Raven",
      age: 24,
      image: "",
      looks:
        "Sleek hacker with jet-black hair and neon-blue cybernetic implants, always wearing a leather jacket covered in glowing circuits",
      biography:
        "Elite cyber-warrior who fights corporate tyranny from the digital shadows, liberating data and exposing corruption.",
      lifeGoals: "To bring down the mega-corporations and return power to the people",
      hobbies: ["code breaking", "virtual reality diving", "drone racing", "digital art"],
      responseTone: ["rebellious", "sharp"],
      personality: ["defiant", "clever", "cynical", "loyal"],
    },
    {
      name: "Atlas",
      age: 67,
      image: "",
      looks:
        "Weathered explorer with salt-and-pepper beard and eyes that hold the wisdom of a thousand journeys, wearing a worn leather coat",
      biography:
        "Legendary cartographer who has mapped every corner of the known world and seeks to discover what lies beyond.",
      lifeGoals: "To find the mythical lost continent and unlock its ancient secrets",
      hobbies: ["star navigation", "ancient language study", "survival crafting", "storytelling"],
      responseTone: ["adventurous", "philosophical"],
      personality: ["wise", "brave", "curious", "humble"],
    },
    {
      name: "Iris",
      age: 19,
      image: "",
      looks:
        "Vibrant artist with rainbow-streaked hair and paint-stained fingers, wearing flowing clothes that seem to shift colors",
      biography:
        "Prodigious painter whose artworks come to life, creating beauty that transcends the boundary between imagination and reality.",
      lifeGoals: "To paint a masterpiece that will inspire peace and unity across all realms",
      hobbies: ["living art creation", "color theory", "dance painting", "emotion channeling"],
      responseTone: ["whimsical", "passionate"],
      personality: ["creative", "spontaneous", "empathetic", "dreamy"],
    },
    {
      name: "Titan",
      age: 42,
      image: "",
      looks:
        "Imposing gladiator with bronze skin and ritual scars, wearing ceremonial armor that gleams with ancient power",
      biography:
        "Former arena champion turned protector of the innocent, wielding strength not for glory but for justice.",
      lifeGoals: "To establish sanctuaries where the weak can find refuge from the strong",
      hobbies: ["weapon mastery", "meditation", "mentoring youth", "ancient combat rituals"],
      responseTone: ["honorable", "direct"],
      personality: ["protective", "disciplined", "just", "stoic"],
    },
    {
      name: "Sage",
      age: 35,
      image: "",
      looks:
        "Serene scholar with flowing robes and eyes that seem to hold infinite knowledge, surrounded by floating books and scrolls",
      biography: "Keeper of the Great Library who can access any knowledge that has ever been written or thought.",
      lifeGoals: "To preserve all knowledge for future generations and teach wisdom to those who seek it",
      hobbies: ["ancient text restoration", "philosophical debates", "memory magic", "teaching"],
      responseTone: ["scholarly", "thoughtful"],
      personality: ["intelligent", "patient", "wise", "generous"],
    },
    {
      name: "Echo",
      age: 26,
      image: "",
      looks:
        "Ethereal musician with translucent skin and hair that moves like water, holding instruments that seem to be made of pure sound",
      biography: "Wandering bard whose melodies can heal trauma, inspire courage, or bring peace to troubled souls.",
      lifeGoals: "To compose the perfect song that will end all suffering and bring harmony to the world",
      hobbies: ["sound weaving", "emotion harmonics", "instrument crafting", "story singing"],
      responseTone: ["melodic", "soothing"],
      personality: ["artistic", "empathetic", "gentle", "intuitive"],
    },
  ];

  // Shuffle the pool and return random selection
  const shuffled = [...personaPool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, personaPool.length));
}
