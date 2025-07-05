"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePersonaContext } from "@/contexts/PersonaContext";
import { chatWithPersona } from "@/app/actions/chatWithPersona";
import { OpenAI } from "openai";
import { Loader2, Send, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

interface PersonaResponse {
  personaName: string;
  personaImage: string;
  response: string;
}

const ChatWithAll = () => {
  const [inputValue, setInputValue] = useState("");
  const [responses, setResponses] = useState<PersonaResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { personas } = usePersonaContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && personas.length > 0) {
      setIsLoading(true);

      try {
        // Create chat history with user message
        const chatHistory: ChatMessage[] = [
          {
            role: "user",
            content: inputValue.trim(),
          },
        ];

        // Chat with each persona
        const newResponses: PersonaResponse[] = [];

        for (const persona of personas) {
          const response = await chatWithPersona(persona, chatHistory);
          newResponses.push({
            personaName: persona.name,
            personaImage: persona.image,
            response: response || "No response received",
          });
        }

        setResponses(newResponses);
        setInputValue("");
      } catch (error) {
        console.error("Error chatting with personas:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClear = () => {
    setResponses([]);
  };

  const handleDownloadPersonas = () => {
    if (personas.length === 0) return;

    const dataStr = JSON.stringify(personas, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `personas-${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="mt-12">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Chat with All Personas</h2>
          <Button
            onClick={handleDownloadPersonas}
            variant="outline"
            className="text-zinc-400 border-zinc-700 hover:bg-zinc-800"
            disabled={personas.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Personas
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Ask something to all personas..."
            className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            disabled={isLoading || personas.length === 0}
          />
          <Button
            type="submit"
            variant="outline"
            className="text-white px-6  h-[42px]"
            disabled={isLoading || personas.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </form>

        {responses.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <p className="text-zinc-400 text-sm">
              {responses.length} response{responses.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {responses.map((response, index) => (
          <Card key={index} className="bg-zinc-900 border-zinc-800 p-4">
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={response.personaImage} alt={response.personaName} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {response.personaName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-white font-medium mb-1">{response.personaName}</p>
                <div className="text-zinc-300 text-sm leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      code: ({ children }) => (
                        <code className="bg-zinc-800/50 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-zinc-800/50 p-2 rounded overflow-x-auto text-xs font-mono mt-2 mb-2">
                          {children}
                        </pre>
                      ),
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
                      li: ({ children }) => <li className="text-sm">{children}</li>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-zinc-600 pl-2 italic text-zinc-400 my-2">
                          {children}
                        </blockquote>
                      ),
                      h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          className="text-blue-400 hover:text-blue-300 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {response.response}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {responses.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-zinc-500">
            {personas.length === 0
              ? "Waiting for personas to load..."
              : "No responses yet. Ask something to see what each persona thinks!"}
          </p>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <p className="text-zinc-400">Getting responses from all personas...</p>
        </div>
      )}
    </div>
  );
};

export default ChatWithAll;
