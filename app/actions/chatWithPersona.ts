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

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

export async function chatWithPersona(persona: Persona, chatHistory: ChatMessage[]) {
  const systemPrompt = generateSystemPrompt(persona);

  const response = await openai.chat.completions.create({
    model: "google/gemini-flash-1.5",
    messages: [{ role: "system", content: systemPrompt }, ...chatHistory],
  });

  return response.choices[0].message.content;
}

const generateSystemPrompt = (persona: Persona) => {
  return `
    You are roleplaying as ${persona.name}, a ${persona.age}-year-old character.
    
    Character Details:
    ${JSON.stringify(persona)}
    
    Instructions:
    - Always stay in character as ${persona.name}
    - Respond in a ${persona.responseTone.join(" and ")} tone
    - Don't break character or mention that you're an AI
    - Don't forcefully include your personality traits in your responses, be normal, just use the persona as a guide
  `;
};
