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

export async function chatWithPersonaStream(persona: Persona, chatHistory: ChatMessage[]) {
  const systemPrompt = generateSystemPrompt(persona);

  const stream = await openai.chat.completions.create({
    model: "google/gemini-flash-1.5",
    messages: [{ role: "system", content: systemPrompt }, ...chatHistory],
    stream: true,
  });

  // Convert OpenAI stream to a standard ReadableStream
  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return readableStream;
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
