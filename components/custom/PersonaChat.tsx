"use client";

import React, { useState, useEffect } from "react";
import { Persona } from "@/types/persona";
import { chatWithPersonaStream } from "@/app/actions/chatWithPersonaStream";
import { generatePersonas } from "@/app/actions/generatePersonas";
import { generateAvatar } from "@/app/actions/generateAvatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { devCache } from "@/lib/devCache";
import { Loader2, RefreshCw, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PersonaChatProps {
  persona: Persona;
  isOpen: boolean;
  onClose: () => void;
  onPersonaUpdated?: (updatedPersona: Persona) => void;
}

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

const PersonaChat: React.FC<PersonaChatProps> = ({ persona, isOpen, onClose, onPersonaUpdated }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Generate a unique persona ID based on name and characteristics
  const personaId = `${persona.name}-${persona.age}-${persona.personality.join("-")}`;

  // Load chat history when component mounts or persona changes
  useEffect(() => {
    if (isOpen) {
      const chatHistory = devCache.loadChatHistory(persona.name, personaId);
      setMessages(chatHistory);
    }
  }, [isOpen, persona.name, personaId]);

  const saveMessage = (message: ChatMessage) => {
    devCache.saveChatMessage(persona.name, personaId, message);
  };

  const handleRegeneratePersona = async () => {
    // Close the window immediately
    onClose();

    try {
      // Generate a new persona
      const newPersonas = await generatePersonas(1);
      if (newPersonas.length > 0) {
        const newPersona = newPersonas[0];

        // Generate avatar for the new persona
        const avatarUrl = await generateAvatar(newPersona);
        const updatedPersona = {
          ...newPersona,
          image: avatarUrl || "",
        };

        // Clear chat history for the old persona
        devCache.clearChatHistory(persona.name, personaId);

        // Notify parent component about the updated persona
        if (onPersonaUpdated) {
          onPersonaUpdated(updatedPersona);
        }
      }
    } catch (error) {
      console.error("Error regenerating persona:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputMessage,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage("");
    setIsLoading(true);

    // Save user message
    saveMessage(userMessage);

    // Create assistant message placeholder
    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    setMessages([...updatedMessages, assistantMessage]);

    try {
      const chatHistory = updatedMessages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      const stream = await chatWithPersonaStream(persona, chatHistory);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullContent += chunk;

        // Update the assistant message with accumulated content
        setMessages(prevMessages => {
          const newMessages = [...prevMessages];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === "assistant") {
            lastMessage.content = fullContent;
          }
          return newMessages;
        });
      }

      // Save the complete assistant message
      assistantMessage.content = fullContent;
      saveMessage(assistantMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prevMessages => {
        const newMessages = [...prevMessages];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === "assistant") {
          lastMessage.content = "I'm sorry, something went wrong. Please try again.";
        }
        return newMessages;
      });

      assistantMessage.content = "I'm sorry, something went wrong. Please try again.";
      saveMessage(assistantMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-5xl max-h-[95vh] h-[95vh] bg-zinc-900 border-zinc-700 text-white flex flex-col px-4 sm:px-6"
        showCloseButton={false}
      >
        <DialogHeader className="pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 flex-shrink-0">
              {persona.image ? (
                <AvatarImage src={persona.image} alt={persona.name} />
              ) : (
                <AvatarFallback className="bg-zinc-700 text-zinc-200">{persona.name.charAt(0)}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <DialogTitle className="text-xl font-bold text-white truncate text-left">{persona.name}</DialogTitle>
              <DialogDescription className="text-zinc-400 text-sm text-left">
                Chat with {persona.name}
                {messages.length > 0 && <span className="ml-2 text-xs">• {messages.length} messages</span>}
              </DialogDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {persona.personality.map((trait, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs bg-zinc-700 text-zinc-200 hover:bg-zinc-600 border-zinc-600"
              >
                {trait}
              </Badge>
            ))}
          </div>
        </DialogHeader>

        {/* Floating Button Island */}
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-2 bg-zinc-800/90 backdrop-blur-sm border border-zinc-700 rounded-lg p-1.5 shadow-lg">
            <Button
              onClick={handleRegeneratePersona}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-700"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-md text-red-400 hover:text-red-300 hover:bg-red-900/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 min-h-0">
          {messages.length === 0 && (
            <div className="text-center text-zinc-400 py-8">
              <p>Start a conversation with {persona.name}!</p>
              <p className="text-sm mt-2">{persona.biography}</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.role === "user" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-100"
                }`}
              >
                <div className="text-sm">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      code: ({ children }) => (
                        <code className="bg-zinc-900/50 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-zinc-900/50 p-2 rounded overflow-x-auto text-xs font-mono mt-2 mb-2">
                          {children}
                        </pre>
                      ),
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
                      li: ({ children }) => <li className="text-sm">{children}</li>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-zinc-600 pl-2 italic text-zinc-300 my-2">
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
                    {message.content}
                  </ReactMarkdown>
                  {/* Show blinking cursor for assistant messages while loading */}
                  {message.role === "assistant" && isLoading && index === messages.length - 1 && (
                    <span className="inline-block w-0.5 h-4 bg-zinc-300 animate-pulse ml-0.5"></span>
                  )}
                </div>
                <p className="text-xs opacity-60 mt-1">{new Date(message.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="border-t border-zinc-700 pt-4">
          <div className="flex gap-2">
            <textarea
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${persona.name}...`}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white placeholder-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              variant="outline"
              size="icon"
              className="text-white px-6 h-auto flex items-center justify-center"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PersonaChat;
